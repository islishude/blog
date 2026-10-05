---
title: "Glamsterdam Gas 重定价：EIP-2780、EIP-8037 与 EIP-8038 对 Solidity dApp 和 EVM Wallet 的影响"
date: 2026-08-16 05:31:27
slug: "blockchain/Glamsterdam-Gas-重定价-EIP-2780-EIP-8037-与-EIP-8038-对-Solidity-dApp-和-EVM-Wallet-的影响"
categories: ["Blockchain"]
tags: []
---

> 面向 Solidity dApp、智能合约基础设施和 EVM Wallet 开发者的迁移指南  
> 信息核对日期：2026-08-16

## 摘要

Glamsterdam 网络升级正在重构 Ethereum 的 gas 定价方式。其中最容易被应用开发者注意到的是 **EIP-2780：Resource-based intrinsic transaction gas**：它不再把 `21,000` 当作所有普通交易共享的固定 intrinsic base，而是把交易入口成本拆成 sender、recipient access、value transfer、contract creation 等资源组件。

但如果只阅读 EIP-2780，很容易低估这次升级对 Solidity 合约的影响。与它配套的 **EIP-8037** 和 **EIP-8038** 会进一步改变：

- 新 account leaf 的创建成本；
- `CALL` / `CALLCODE` 的 value transfer 成本；
- `CREATE` / `CREATE2` 的创建成本；
- runtime bytecode 的 code-deposit 成本；
- `SSTORE` 创建新 storage slot 的成本；
- cold account access、account write、storage write 的成本；
- transaction 与 block 两个层面的 gas accounting。

截至 2026-08-16，EIP-2780、EIP-8037、EIP-8038 均处于 **Review** 状态，但已经在 Glamsterdam Meta EIP（EIP-7773）中列为 **Scheduled for Inclusion**。Sepolia、Holešky 和 Mainnet 的激活时间仍未填写。因此本文中的数值应理解为**当前规范参数，而不是已经在主网生效且不会再调整的常量**。

对于应用开发者，可以先记住四个结论：

1. **不要再把 `21,000` 当成 Ethereum 交易的固定最小 gas 或 ETH transfer gas。**
2. **向真正不存在的地址第一次转 ETH，会因为创建 account state 而显著变贵。**
3. **合约内部的 `CALL{value: ...}`、Solidity `transfer()` / `send()` 同样受到影响。**
4. **`CREATE` / `CREATE2`、首次 `SSTORE 0 → non-zero` 的成本变化甚至比普通 ETH transfer 更值得关注。**

---

## 1. 为什么 EIP-2780 不能单独看

EIP-2780 解决的是 transaction entry point 的定价问题：过去所有普通交易都从一个固定的 `21,000` intrinsic gas 开始，但不同交易实际消耗的客户端资源并不相同。

Glamsterdam 的整体思路更接近下面这个模型：

```text
State-touching operation
        │
        ├── Access
        │     └── 读取 account / storage
        │
        ├── Write
        │     └── 修改已经存在的 state leaf
        │
        └── State Creation
              └── 创建新的 account / storage / code state
```

三个 EIP 的职责大致可以这样理解：

| EIP | 主要职责 |
| --- | --- |
| EIP-2780 | 拆分 transaction intrinsic gas，并把 state-dependent 成本移动到 runtime / pre-execution |
| EIP-8037 | 提高并统一 durable state creation 的定价，引入 `state-gas` dimension |
| EIP-8038 | 重构 state access / write 定价，例如 cold account access、account write、storage write |

因此，对 wallet 来说，EIP-2780 是最直接的兼容性入口；对 Solidity 合约和协议经济模型来说，真正需要一起分析的是：

```text
EIP-2780 + EIP-8037 + EIP-8038
```

---

## 2. EIP-2780：`21,000` 被拆成了什么

当前 EIP-2780 使用的核心参数包括：

```text
TX_BASE_COST        = 12,000
TX_VALUE_COST       =  6,000
COLD_ACCOUNT_ACCESS =  3,000   // from EIP-8038
CREATE_ACCESS       = 12,000   // from EIP-8038
ACCOUNT_WRITE       =  9,000   // from EIP-8038
```

普通 ETH transfer 到一个已经存在的 EOA：

```text
TX_BASE_COST          12,000
COLD_ACCOUNT_ACCESS    3,000
TX_VALUE_COST          6,000
────────────────────────────
execution gas         21,000
```

所以一个重要事实是：

> **EOA → existing EOA 的普通 ETH transfer，在当前提案参数下仍然是 21,000 execution gas。**

变化不是简单地“21k 被整体降低”，而是 21k 被拆成了资源组件。

参考 transaction case：

| 场景 | Execution gas | State gas |
| --- | ---: | ---: |
| self-transfer | 12,000 | 0 |
| zero-value → existing EOA / empty account | 15,000 | 0 |
| ETH → existing EOA | 21,000 | 0 |
| contract creation tx | 24,000 + execution | 183,600（若创建新 account） |
| ETH → fresh address | 21,000 | 183,600 |

calldata、access list 等其他成本仍需要额外计算。

---

## 3. 最大的用户可见变化：第一次给 fresh address 转 ETH

首先需要严格区分“没有 code”和“account 不存在”。

一个地址满足：

```text
eth_getCode(address) == "0x"
```

并不能说明它是 fresh address。

根据当前 EIP-8037 的 account existence 规则，只要 state 中已经存在 account leaf——例如具有：

```text
non-zero balance
or
non-zero nonce
or
non-empty code
```

它就是 existing account。

因此：

```text
code == empty
```

不等于：

```text
account == non-existent
```

### 3.1 Fresh account 的 state cost

EIP-8037 当前参数为：

```text
CPSB                        = 1530 gas / byte
STATE_BYTES_PER_NEW_ACCOUNT = 120 bytes
```

因此创建一个新的 account leaf：

```text
120 × 1530 = 183,600 state gas
```

对于：

```text
EOA Alice
   │
   │ 1 ETH
   ▼
fresh address Bob
```

当前提案下：

```text
execution gas = 21,000
state gas     = 183,600
────────────────────────
total paid    = 204,600 gas
```

这里忽略零 calldata 之外的额外因素。

这与向 existing EOA 转 ETH 的 `21,000` 形成明显差异。

### 3.2 为什么这 183,600 不放进 intrinsic gas

EIP-2780 的一个核心设计目标是：

> intrinsic gas 必须可以在不读取 Ethereum state 的情况下计算。

判断 recipient 是否真正存在需要读取 state，因此 new-account charge 是 state-dependent 的，不能作为 transaction validity 的 intrinsic 输入。

流程变为：

```text
Transaction received
      │
      ▼
state-independent intrinsic validation
      │
      │ valid
      ▼
pre-execution / runtime charges
      │
      ├── new account?
      ├── 7702 delegation?
      └── other state-dependent work
      │
      ▼
first EVM frame
```

这会产生一个对 wallet 很重要的新行为：

```text
gasLimit >= intrinsicGas
```

不再等价于：

```text
transaction has enough gas to execute
```

一笔 ETH transfer 到 fresh address，如果只提供 `21,000` gas，可能通过 intrinsic validity check，但在 pre-execution 的 new-account state charge 阶段 OOG；交易仍可被包含，状态回滚，并消耗相应 gas。

---

## 4. 合约内部 ETH transfer 也会变化

EIP-2780 主要描述顶层 transaction，但同一套资源定价会通过 EIP-8037 / EIP-8038 作用于 EVM opcode。

例如：

```solidity
function pay(address payable recipient) external {
    recipient.transfer(1 ether);
}
```

或者：

```solidity
(bool ok,) = recipient.call{value: 1 ether}("");
require(ok);
```

最终都会进入 value-bearing `CALL` 路径。

### 4.1 Existing recipient

对于 value-bearing `CALL`，EIP-8038 把成本拆成：

```text
account access
+
account write
+
optional state creation
```

当前参数：

```text
COLD_ACCOUNT_ACCESS = 3,000
WARM_ACCESS         =   100
ACCOUNT_WRITE       = 9,000
CALL_STIPEND        = 2,300  // unchanged
```

如果 recipient 已经存在，不会产生 new-account state gas。

### 4.2 Fresh recipient

如果满足：

```text
CALL* with value
+
target account does not exist
```

则 EIP-8037 额外收取：

```text
STATE_BYTES_PER_NEW_ACCOUNT × CPSB
= 120 × 1530
= 183,600 state gas
```

这不是一个全新的概念：当前 EVM 对合约内部 value transfer 到 dead/new account 已经存在 `GAS_NEW_ACCOUNT = 25,000`。

因此更准确的比较是：

```text
Before Glamsterdam
GAS_NEW_ACCOUNT = 25,000

After Glamsterdam
GAS_NEW_ACCOUNT → 183,600 state gas
```

也就是说，内部 `CALL{value}` 创建 account 的 durable state 成本被显著 repricing。

---

## 5. Solidity `transfer()` 的 2300 stipend 会不会让 fresh-address transfer 必然失败？

不会。

这是一个很容易误判的问题。

Solidity：

```solidity
recipient.transfer(value);
```

使用 value-bearing call，并只给 recipient child call 很小的可执行 gas budget。EIP-8038 保留：

```text
CALL_STIPEND = 2300
```

但 `183,600 state gas` **不是进入 child frame 后从这 2300 中扣除的**。

根据 EIP-8037，`CALL*` 的 new-account state-gas charge 在进入相应 child frame **之前**进行。

可以把它理解成：

```text
Parent frame
    │
    │ transfer(value)
    ▼
CALL
    │
    ├── access/write accounting
    │
    ├── target non-existent?
    │       │
    │       └── charge 183,600 state gas
    │
    ▼
enter child frame
    │
    └── stipend semantics remain
```

而不是：

```text
2300 - 183600 = OOG
```

因此，对于没有 code 的 fresh address：

```solidity
payable(freshAddress).transfer(1 ether);
```

并不会仅仅因为 new-account charge 大于 2300 而必然失败；真正需要足够预算的是整个 transaction / parent execution 的 gas accounting。

当然，`transfer()` 原本就可能在 recipient 是复杂合约、其 receive/fallback 需要超过 stipend 时失败，这一点并没有因为这些 EIP 消失。

---

## 6. `transfer()`、`send()`、`call{value: ...}` 的共同影响

从协议的 state accounting 角度，三种 Solidity 写法最终都可能触发 value-bearing `CALL`：

```solidity
recipient.transfer(value);
```

```solidity
bool ok = recipient.send(value);
```

```solidity
(bool ok,) = recipient.call{value: value}("");
```

如果 recipient 不存在：

```text
account access
+
account write
+
new account state creation
```

其中最后一项当前是：

```text
183,600 state gas
```

因此批量付款协议需要特别关注：

```solidity
for (uint256 i; i < recipients.length; ++i) {
    recipients[i].call{value: amounts[i]}("");
}
```

如果 recipients 中有大量从未进入 state 的地址，单笔 transaction 的成本可能与“全部 recipient 已经存在”的情况出现很大差异。

---

## 7. `CREATE` / `CREATE2` 的成本变化更值得关注

对于 factory、smart account、minimal proxy、CREATE2 deterministic deployment 等架构，EIP-8037 的影响通常比普通 ETH transfer 更大。

### 7.1 当前模型

今天 `CREATE` / `CREATE2` 的核心 state-related 成本通常包含：

```text
GAS_CREATE       = 32,000
GAS_CODE_DEPOSIT = 200 gas / runtime byte
```

还需要考虑 initcode execution、memory expansion、CREATE2 hashing 等其他成本。

### 7.2 Glamsterdam 当前模型

EIP-8037 / EIP-8038 把它拆成：

```text
CREATE_ACCESS
+
new account state gas (if needed)
+
code-deposit state gas
+
code hash execution cost
+
initcode / memory / opcode execution...
```

当前参数：

```text
CREATE_ACCESS = 12,000 execution gas
```

创建一个新的 account：

```text
120 × 1530
= 183,600 state gas
```

部署 runtime bytecode 长度 `L`：

```text
L × 1530 state gas
```

另外还有当前 EIP-8037 定义的 code hash execution charge：

```text
6 × ceil(L / 32)
```

因此，对于 fresh address：

```text
CREATE / CREATE2
    │
    ├── 12,000 execution gas: CREATE_ACCESS
    │
    ├── 183,600 state gas: account leaf
    │
    ├── L × 1530 state gas: runtime bytecode
    │
    └── initcode / memory / hash / constructor / other execution
```

### 7.3 一个 5,000-byte runtime contract 的示例

只考虑 new account + runtime code：

```text
new account:
120 × 1530
= 183,600

runtime code:
5,000 × 1530
= 7,650,000

state gas subtotal:
= 7,833,600
```

这还没有包含：

- `CREATE_ACCESS`；
- constructor execution；
- initcode execution；
- memory expansion；
- CREATE2 initcode hash cost；
- constructor 内部的 `SSTORE`；
- 其他 opcode。

所以对于频繁部署新实例的协议，deployment economics 必须重新 benchmark。

---

## 8. Prefunded CREATE2 address：一个容易误解的特殊情况

假设 factory 可以预计算 CREATE2 地址：

```text
factory + salt + initCodeHash
        ↓
futureAddress
```

如果 `futureAddress` 在 deployment 前已经持有 ETH：

```text
balance > 0
nonce   = 0
code    = empty
```

根据当前 EIP-8037 的 existence rule，它已经具有 account leaf，因此属于 existing account。

之后 `CREATE2` 部署到这个地址时：

```text
new-account state charge = 0
```

但 runtime code 仍需要：

```text
L × CPSB
```

也就是说：

```text
CREATE2 → truly fresh address
= 183,600 account state gas
+ L × 1530 code state gas

CREATE2 → already-existing prefunded address
= L × 1530 code state gas
```

不过这**不应该被理解成一种免费节省 183,600 gas 的优化**。

如果 prefunding 本身发生在 Glamsterdam 激活之后，那么首次向这个地址转 ETH 时已经支付了创建 account leaf 的 state gas；CREATE2 只是不用再次支付。

所以它更准确地说是：

> account creation cost 在 prefunding 时已经发生，而不是部署时被永久规避。

如果地址在升级前就已经存在，则部署后的成本分布当然不同。

---

## 9. `SSTORE 0 → non-zero` 也会显著变贵

EIP-8037 并不只针对 account 和 contract code。

当前参数：

```text
STATE_BYTES_PER_STORAGE_SET = 64
CPSB                        = 1530
```

因此首次创建一个 storage slot：

```text
64 × 1530
= 97,920 state gas
```

EIP-8038 同时定义：

```text
STORAGE_WRITE       = 10,000
COLD_STORAGE_ACCESS =  2,100
WARM_ACCESS         =    100
```

因此，一个 cold、全新的 `SSTORE 0 → non-zero`，资源组件大致为：

```text
2,100   cold storage access
10,000  storage write
97,920  state creation
──────────────────────────
110,020 gas-equivalent paid across execution/state dimensions
```

这意味着大量依赖“每个用户第一次写 mapping”的 dApp，需要重新审视首次交互成本。

例如：

```solidity
mapping(address => uint256) public balances;

function initializeUser(uint256 amount) external {
    balances[msg.sender] = amount;
}
```

如果对应 slot 在 transaction start 时为 zero，并最终变为 non-zero，就涉及 new-storage state creation。

需要注意：EIP-8037 引入 state-gas refill。如果 transaction/frame 后续回滚，使新增 state 没有永久落盘，对应 state-gas creation charge 会被 refill；它不是简单等同于传统的 20% refund counter。

---

## 10. Execution gas 与 State gas：为什么用户仍然只有一个 `tx.gas`

EIP-8037 引入两个内部维度：

```text
execution-gas
state-gas
```

但 transaction 格式仍然只有：

```text
tx.gas
```

不会要求 wallet 让用户分别输入：

```text
executionGasLimit
stateGasLimit
```

规范通过 reservoir model 管理这两个维度。

抽象理解：

```text
                   tx.gas
                     │
        ┌────────────┴────────────┐
        │                         │
  execution gas budget       state gas reservoir
        │                         │
        └────────────┬────────────┘
                     │
              transaction execution
```

state-gas charge 优先从 reservoir 扣除；reservoir 不足时可以继续消耗 frame 的 `gas_left`。`GAS` opcode / Solidity `gasleft()` 只观察 `gas_left`，不包括 reservoir。

因此依赖精确 `gasleft()` 边界的协议需要重新测试。

---

## 11. Transaction gas 与 Block gas 的语义也发生变化

EIP-8037 中，用户最终支付的 transaction gas 仍然考虑 execution + state 两个维度。

但 block-level accounting 不再简单把二者相加作为 bottleneck：

```text
block gas_used
=
max(
    block_execution_gas_used,
    block_state_gas_used
)
```

这会产生一个非常重要的基础设施兼容性变化：

> `block.gasUsed` 不应该再被假设为所有 transaction receipt gas used 的简单和。

而 receipt 的 `cumulative_gas_used` 仍跟踪 transaction 层实际计费的累计值。

因此以下系统应检查现有假设：

- block explorer；
- EVM indexer；
- wallet analytics；
- gas dashboard；
- RPC proxy；
- block utilization 统计；
- fee analytics / accounting pipeline。

---

## 12. 对 EVM Wallet 开发者意味着什么

### 12.1 删除所有 `21,000` hardcode

建议全局搜索：

```text
21000
21_000
0x5208
```

尤其检查：

```ts
if (isNativeTransfer(tx)) {
  gasLimit = 21_000n;
}
```

以及：

```ts
if (gasLimit < 21_000n) {
  throw new Error("invalid gas limit");
}
```

因为 Glamsterdam 之后：

- 合法 transaction 可以低于 21k，例如 self-transfer 的基础情况；
- ETH transfer 到 fresh account 又可能远高于 21k；
- 21k 不再具有“Ethereum universal minimum”的语义。

### 12.2 Native ETH transfer 也应该走 `eth_estimateGas`

不要再采用：

```text
native ETH transfer
        ↓
recipient looks like EOA
        ↓
gas = 21000
```

推荐统一：

```text
User intent
    ↓
build transaction
    ↓
eth_estimateGas / equivalent simulation
    ↓
apply wallet safety policy
    ↓
fee estimate
    ↓
sign
```

### 12.3 不要用 `eth_getCode()` 判断“是否需要 21k”

错误逻辑：

```ts
const code = await provider.getCode(to);
if (code === "0x") {
  gas = 21_000n;
}
```

原因：

```text
empty code ≠ non-existent account
```

一个 existing EOA 与一个从未进入 state 的 fresh address 都可能返回空 code，但其 state-creation cost 完全不同。

### 12.4 删除 `estimateGas failure → fallback 21000`

这是升级后尤其危险的逻辑：

```ts
try {
  return await estimateGas(tx);
} catch {
  return 21_000n;
}
```

如果失败原因来自 RPC 或模拟环境，而实际 recipient 是 fresh address，这种 fallback 可能生成一笔 intrinsic-valid 但 runtime OOG 的 transaction。

更合理的策略是：

```text
estimate failure
    ↓
retry another trusted RPC / simulation backend
or
surface estimation failure
```

而不是猜一个 protocol constant。

### 12.5 UI 应能解释 fresh-address funding 的高 gas

如果普通用户看到：

```text
ETH transfer
estimated gas ≈ 204,600
```

而过去习惯于 21k，wallet 最好提供原因解释，例如：

> The recipient does not yet have an account in Ethereum state. This transfer creates a new account state entry and therefore requires additional state gas.

检测可以用于 UX，但最终 gas limit 仍应由 protocol-aware simulation 决定。

### 12.6 7702 Wallet 需要一起 regression test

EIP-2780 还重新拆分 EIP-7702 authorization 的 state-independent intrinsic 与 state-dependent runtime charge，包括：

- authority account creation；
- authority account write；
- delegation indicator state bytes；
- delegation target access。

如果 wallet 自己复制了一套 authorization intrinsic gas 公式，也需要随着 fork 参数更新。

原则上应尽量避免让 wallet 业务层维护 Ethereum consensus gas schedule 的完整镜像。

---

## 13. 对 Solidity dApp / Protocol 开发者意味着什么

普通 Solidity ABI、`msg.sender`、`msg.value`、`receive()` 等语义不会因为这些 EIP 而改变。

真正需要审计的是 gas-sensitive architecture。

### 高优先级检查对象

#### 1. 批量 ETH payout

```solidity
for (...) {
    recipients[i].call{value: amount}("");
}
```

需要测试 recipient existing / fresh 的混合场景。

#### 2. Smart Account Factory

```solidity
new Account{salt: salt}(...);
```

Account Abstraction wallet factory、per-user account deployment 都会受到 new account + code state repricing 的直接影响。

#### 3. Minimal Proxy / Clone Factory

即使 clone runtime code 很小，仍然需要重新 benchmark：

```text
account state
+
code state
+
initialization storage
```

#### 4. 大量第一次 `SSTORE`

例如：

```solidity
users[user] = User(...);
positions[id] = Position(...);
orders[id] = Order(...);
```

大量 zero → non-zero slot 创建的成本会提高。

#### 5. 精确 gas accounting

例如：

```solidity
require(gasleft() >= MIN_GAS);
```

或者 assembly 中依赖精确 forwarding：

```solidity
assembly {
    let ok := call(g, target, value, ptr, len, 0, 0)
}
```

EIP-8037 的 reservoir 与 runtime state charge 会改变进入 frame 后 `gasleft()` 的边界条件，因此应重新跑 fork-specific tests。

---

## 14. 推荐测试矩阵

升级前至少应覆盖以下情况：

| Case | Wallet | Contract / dApp |
| --- | --- | --- |
| ETH → existing EOA | ✅ | ✅ |
| ETH → fresh address | ✅ | ✅ |
| zero-value → EOA | ✅ | 视业务 |
| ETH → contract | ✅ | ✅ |
| ETH → EIP-7702 delegated account | ✅ | 视业务 |
| self-transfer | ✅ | 低优先级 |
| internal `CALL{value}` → existing | 视 wallet 类型 | ✅ |
| internal `CALL{value}` → fresh | 视 wallet 类型 | ✅ |
| Solidity `transfer()` → fresh | 智能钱包需要 | ✅ |
| `CREATE` → fresh | 智能钱包/factory | ✅ |
| `CREATE2` → fresh | 智能钱包/factory | ✅ |
| `CREATE2` → prefunded existing address | 智能钱包/factory | ✅ |
| `SSTORE 0 → non-zero` | 智能账户需要 | ✅ |
| create then revert | 智能账户需要 | ✅ |
| storage create then revert/reset | 智能账户需要 | ✅ |
| block `gasUsed` analytics | ✅ | indexer/backend |

尤其建议增加两个 wallet regression tests：

```text
Case A
existing EOA
value > 0
gas = estimateGas(...)
→ success
```

和：

```text
Case B
fresh recipient
value > 0
manually gas = 21000
→ transaction may pass intrinsic validity
→ runtime new-account charge lacks budget
→ OOG / reverted transaction
```

这样可以直接发现旧式 `21k shortcut` 是否仍存在。

---

## 15. 一张表总结主要 repricing

以下数字基于 2026-08-16 的当前 EIP 文本：

| Resource | Before | Current Glamsterdam proposal |
| --- | ---: | ---: |
| Plain ETH → existing EOA | 21,000 tx gas | 21,000 execution gas |
| Top-level ETH → fresh address | 21,000 | 21,000 execution + 183,600 state |
| Internal CALL new-account component | 25,000 | 183,600 state |
| `CREATE` / `CREATE2` account creation component | part of 32,000 `GAS_CREATE` | 183,600 state + 12,000 `CREATE_ACCESS` execution |
| Runtime code deposit | 200 / byte | 1,530 state gas / byte + hash execution cost |
| New storage slot state component | 20,000 `GAS_STORAGE_SET` | 97,920 state gas, plus access/write execution components |
| Cold account access | 2,600 | 3,000 |
| Account write equivalent | ~6,700 component | 9,000 |
| Storage write equivalent | ~2,800 component | 10,000 |

需要强调：旧 gas schedule 的某些值是 composite constants，而新模型把它们拆成独立 resource components，因此表格中的某些行不是严格的“一对一 opcode 总成本比较”。最终精确 gas 应以对应 fork 的 execution client 实现和 simulation 为准。

---

## 16. 推荐的 Wallet 架构原则

过去常见：

```text
build tx
   │
   ├── native transfer → gas = 21000
   │
   └── contract call   → estimateGas
```

更稳妥的设计是：

```text
                User intent
                    │
                    ▼
             Build transaction
                    │
                    ▼
           state-aware simulation
            / eth_estimateGas
                    │
          ┌─────────┴─────────┐
          │                   │
       success              failure
          │                   │
          ▼                   ▼
  wallet gas policy      retry / error
          │              never guess 21k
          ▼
      fee estimate
          │
          ▼
      user confirms
          │
          ▼
         sign
          │
          ▼
       broadcast
```

核心原则是：

> **Wallet 应该尽量避免把完整 consensus gas schedule 复制到业务层。**

Wallet 负责 transaction construction、serialization、signing、policy 和 UX；state-aware gas calculation 应尽可能委托给与目标 fork 一致的 execution client / simulator。

---

## 17. 迁移优先级

### EVM Wallet

**P0 — 必须检查**

- 删除 `21000` / `21_000` / `0x5208` 的 universal-minimum 假设；
- native transfer 统一使用 gas estimation；
- 删除 `estimateGas failure → 21000` fallback；
- 允许合法的 `< 21,000` intrinsic 场景；
- 确保 RPC / simulation backend 支持目标 fork gas rules。

**P1 — 应该完成**

- fresh-address funding UX；
- EIP-7702 authorization estimation regression tests；
- smart-account / delegated-account simulation；
- transaction failure reason 对 runtime OOG 的正确展示。

**P2 — 基础设施**

- audit `block.gasUsed == Σ receipt gasUsed` 假设；
- audit fee analytics；
- 配合 EIP-7708 处理 native ETH transfer log，避免 transfer 被重复识别。

### Solidity dApp / Protocol

**P0**

- 普通 ABI 和大多数业务逻辑无需仅为 EIP-2780 修改。

**P1**

- audit exact-gas assumptions；
- audit `gasleft()` / explicit call gas；
- audit batch native transfer；
- audit payable routing / withdrawal contracts。

**P2 — 经济模型重新 benchmark**

- `CREATE` / `CREATE2` factories；
- smart account deployment；
- minimal proxies / clones；
- per-user contracts；
- first-write-heavy storage models；
- registry / order book / position systems 中的大量首次 `SSTORE`。

---

## 18. 结论

如果只从表面看，EIP-2780 像是在“拆掉固定的 21,000 intrinsic gas”。

但从工程角度，更准确的理解是：

> Glamsterdam 正在让 Ethereum gas schedule 更显式地按照 **Access、Write、Durable State Creation** 等实际资源进行计价。

这会直接打破两个长期存在的应用层假设：

```text
ETH transfer == 21,000 gas
```

以及：

```text
CREATE / SSTORE 的历史固定 gas 常量
≈ state growth 的稳定成本代理
```

对于 EVM Wallet，最重要的迁移动作是：**彻底去除 21k shortcut，把 native transfer 也交给 state-aware simulation。**

对于 Solidity dApp 和协议开发者，更大的风险则在：**fresh-account funding、`CALL{value}`、CREATE/CREATE2、contract code deposit 和首次 storage creation 的经济模型变化。**

尤其是 Account Abstraction、wallet factory、CREATE2 deterministic deployment、clone factory 和 state-heavy protocol，不应该只做兼容性测试，而应在 Glamsterdam devnet/testnet 可用后重新建立完整 gas benchmark。

最后，本文所有数字都应绑定到一个前提：**它们是 2026-08-16 当前 Review 版本 EIP 的参数。** Glamsterdam 尚未公布 Sepolia、Holešky 和 Mainnet 的激活时间，规范在正式激活前仍可能继续调整。生产系统应通过 fork-aware execution client 和持续的 regression tests，而不是长期 hardcode 本文中的数值，来获得最终兼容性。

---

## 参考资料

- [EIP-2780: Resource-based intrinsic transaction gas](https://eips.ethereum.org/EIPS/eip-2780)
- [EIP-8037: State Creation Gas Cost Increase](https://eips.ethereum.org/EIPS/eip-8037)
- [EIP-8038: State-access gas cost update](https://eips.ethereum.org/EIPS/eip-8038)
- [EIP-7773: Hardfork Meta — Glamsterdam](https://eips.ethereum.org/EIPS/eip-7773)
- [EIP-8007: Glamsterdam Gas Repricings](https://eips.ethereum.org/EIPS/eip-8007)
- [EIP-7708: ETH transfers emit a log](https://eips.ethereum.org/EIPS/eip-7708)

---

原文：[GitHub Issue #300](https://github.com/islishude/blog/issues/300)
