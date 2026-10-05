---
title: "Solidity 0.8.0 破坏性更新"
date: 2020-12-18 13:59:32
slug: "blockchain/Solidity-0-8-0-破坏性更新"
categories: ["Blockchain"]
tags: ["Blockchain"]
---

## 数值计算默认不会出现溢出

如果溢出会返回 `Panic(uint256)` 错误，具体值为 `Panic(11)`，ERC20 再也不需要 SafeMath 库了。

```Solidity
    function transfer(address to, uint256 tokens) public returns (bool) {
        balanceOf[msg.sender] -= tokens;
        balanceOf[to] += tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }
```

如果要开启溢出，那么要加上 `uncheck {...}` 代码块。

## 查询 chainid

在 0.8 中，chainid 的获取加上了语法糖，可以在 block.chainid 直接获取。

```Solidity
    function getchainid() view public returns (uint256) {
        return block.chainid;
    }
```

## msg.sender 和 tx.origin 默认不再 payable

```Solidity
payable(msg.sender).transfer(100);
payable(tx.orgiin).transfer(address(this).balance);
```

## 地址属性和方法扩展

支持查询 codehash

```Solidity
bytes32 hash = address(0x0).codehash
```

支持获取合约代码 ~~但是再获取 length 还是会拷贝代码~~

[0.8.1](https://github.com/ethereum/solidity/releases/tag/v0.8.1) 版本开始，`address.code.length` 会直接使用 `extcodesize` 操作码，不再有副作用。

```Solidity
bytes memory codes = address(this).code;
```

## receive() 仅用于充值

receive() 方法内部不允许处理 msg.data，只能使用 fallback() 方法。

## 默认开启 ABI V2 编解码支持

V2 编码已经默认开启，允许将结构体、动态嵌套的类型传递到函数中，也可以作为返回值或者从 Event 发出。

```Solidity
    struct Transaction {
        address from;
        address to;
        uint256 value;
    }
    
    event Transfer(Transaction tx);

    function transfer(Transaction[] calldata txes) public returns (Transaction memory) {
        require(txes.length > 1, "empty txes");
        for (uint i = 0; i < txes.length; i++){
            emit Transfer(txes[i]);
        }
        return txes[0];
    }
```

如果继续要使用 V1 ，那么使用 `pragma abicoder v1` 指令。

---

原文：[GitHub Issue #245](https://github.com/islishude/blog/issues/245)
