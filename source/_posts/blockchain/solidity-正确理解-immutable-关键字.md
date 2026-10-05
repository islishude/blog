---
title: "solidity: 正确理解 immutable 关键字"
date: 2023-09-12 05:21:23
slug: "blockchain/solidity-正确理解-immutable-关键字"
categories: ["Blockchain"]
tags: ["Solidity"]
---

Solidity 早在[0.6.5 版本](https://github.com/ethereum/solidity/releases/tag/v0.6.5)就引入了 immutable关键字。

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract ImmutablesExample {
    uint256 immutable p1;
    // 合约属性可以直接初始化
    address payable immutable owner = payable(msg.sender);
    uint256 immutable p2 = 100;

    constructor(uint256 _p1) {
        // 也可以在构造函数内初始化
        require(p2 >= _p1, "p2 < p1");
        p1 = _p1;
    }
 
    // 读取需要使用 view 不可使用 pure
    // TypeError: Function declared as pure
    // but this expression (potentially) reads from the environment or state and thus requires "view".
    function isOwner(address _owner) public view returns (bool) {
        return _owner== owner; // 运行时常量替换，不需要使用 sload
    }

    // 不可更改
    // TypeError: Cannot write to immutable here:
    // Immutable variables can only be initialized inline or assigned directly in the constructor.
    // function changeOwner(address payable newOwner) external {
    //     owner = newOwner;
    // }
}
```

immutable 可以认为是运行时常量，数据直接存储在已部署的字节码中，所以并**不会占用存储槽**。

官方博客这样解释其工作原理：

> 虽然常规状态变量以固定偏移量存储在存储中，但不可变变量的情况并非如此。相反，不可变数据直接存储在已部署的字节码中，即运行时代码将包含每次读取不可变数据的占位符，并且创建代码会将不可变数据插入到这些占位符中。实际上，这意味着在运行时读取不可变数据将减少为普通的PUSH32操作码。https://soliditylang.org/blog/2020/05/13/immutable-keyword/

不占用存储嘈的特性使得它在代理合约中广泛使用，例如在 Agent 智能钱包合约 [Proxy.sol](https://github.com/argentlabs/argent-contracts/blob/develop/contracts/wallet/Proxy.sol) 代码中：

```solidity
contract Proxy {
    address immutable public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    fallback() external payable {
        address target = implementation;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {revert(0, returndatasize())}
            default {return (0, returndatasize())}
        }
    }
}
```

这样做， implementation 属性不会占用 slot0 ，也就不会导致代理和实现合约的状态冲突。

---

原文：[GitHub Issue #257](https://github.com/islishude/blog/issues/257)
