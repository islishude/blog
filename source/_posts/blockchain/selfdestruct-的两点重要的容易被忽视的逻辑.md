---
title: "selfdestruct 的两点重要的容易被忽视的逻辑"
date: 2022-02-14 14:43:05
slug: "blockchain/selfdestruct-的两点重要的容易被忽视的逻辑"
categories: ["Blockchain"]
tags: ["Solidity"]
---

`selfdestruct(address payable recipient)` 的作用是销毁当前合同状态，将其资金发送到给定地址，在之前的 solidity 编译器中也叫做 `suicide`，因其带有负面意义改为 `selfdestruct`

其中有两点很重要的，而且很容易被忽视的

## 强制发送余额，不会执行 receive 函数

下面代码 Factory 没有 `receive()` 方法，也会可以执行成功的，当然就算有 `receive()` 方法也不会执行。

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Replica {
    constructor() payable {}
    function destory() public {
        selfdestruct(payable(msg.sender));
    }
}

contract Factory {
    constructor() payable {
        Replica replica = new Replica{value: msg.value}();
        replica.destory();
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

这个很重要的一点就是，要防止错误使用 `address(this).balance` 判断逻辑，参考这篇[文章](https://solidity-by-example.org/hacks/self-destruct/)

其实在 EVM 中的执行逻辑是，只是做了直接对目标地址进行增加余额这个操作。

另外如果合约创建时立刻销毁，并且销毁时把余额转给自己，那么这个余额会永远被 Burn 掉，所以利用这个特性，可以做一个永久 Ether Burn 的合约。

```solidity
contract Burner {
    constructor() payable {
        selfdestruct(payable(address(this)));
    }
}

contract BurnerEntrypoint {
    function burnEther() public payable {
        new Burner{ value: msg.value }();
    }
}
```

update: Amsterdam 升级，也就是[eip-8246](https://eips.ethereum.org/EIPS/eip-8246) 将不再允许销毁 ETH。

## 交易结束后才清除合约代码

执行下面代码， Replica 先被调用 `selfdestruct` 之后又调用了 `doSomething()` 方法，整体是成功的，而且也打印了相关事件。

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Replica {
    constructor() payable {}
    function destory() public {
        selfdestruct(payable(msg.sender));
    }

    event Something();
    function doSomething() public {
        emit Something();
    }
}

contract Factory {
    constructor() payable {
        Replica replica = new Replica{value: msg.value}();
        replica.destory();
        replica.doSomething();
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

Solidity 文档原文是这样说的 

> the contract is only really destroyed at the end of the transaction and revert s might “undo” the destruction.

这两点是最容易被忽视的，而且容易引起安全问题。

## 不再清除状态，仅将余额转移

坎昆升级后，SELFDESTRUCT 仅将所有资金退回到目标账户，但不会删除帐户，除非在创建时在同一交易中调用

> SELFDESTRUCT will recover all funds to the target but not delete the account, except when called in the same transaction as creation

也就是说 selfdestruct 还能继续用，之前已有的合约如果使用，那么状态不会被删除，仅仅把余额进行了转移。新的合约可以允许在当前交易上下文进行创建并删除。

---

原文：[GitHub Issue #252](https://github.com/islishude/blog/issues/252)
