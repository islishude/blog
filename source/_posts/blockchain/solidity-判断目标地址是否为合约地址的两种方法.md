---
title: 'solidity: 判断目标地址是否为合约地址的两种方法'
categories:
  - blockchain
date: 2020-09-21 22:14:54
tags:
---

目前常用两种方式判断目标地址是否为合约，如下所示

```Solidity
pragma solidity ^0.7.0;

contract Contract {
    function isContract_1(address token) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(token)
        }
        return size > 0;
    }

    function isContract_2(address account) internal view returns (bool) {
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        assembly { codehash := extcodehash(account) }
        return (codehash != 0x0 && codehash != accountHash);
    }
}
```


第一种根据目标地址的代码是否为空判断，extcodesize 操作码 gas 消耗为 700。

另一种是根据目标代码 keccack256 的哈希来判断，参考 [EIP1052](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1052.md)，空值哈希正好是 `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`，extcodehash 操作码 gas 消耗为 400。