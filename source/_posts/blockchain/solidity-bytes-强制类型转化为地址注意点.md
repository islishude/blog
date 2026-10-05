---
title: "solidity: bytes 强制类型转化为地址注意点"
date: 2022-04-24 16:02:20
slug: "blockchain/solidity-bytes-强制类型转化为地址注意点"
categories: ["Blockchain"]
tags: ["Solidity"]
---

当 bytes32 转换为 address 时候，需要进行强制转换，通常有两种方式

第一种，转换为 bytes20 然后再转换为 address

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Parser {
    function parse(bytes32 code) public pure returns (address) {
        return address(bytes20(code));
    }
}   
```

第二种，转化为 uint160 再转换为 address

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Parser {
    function parse(bytes32 code) public pure returns (address) {
        return address(uint160(uint256(code)));
    }
}   
```

这两种方式看起来差不多，其实输出是不一样的。第一种会取前 20 字节，也就是后面数据截断；第二种是取后 20 字节，也就是溢出的形式。

例如使用 `0xe69b9548081a52fc6972902887aa83079e169569f88c911b052464a25460a5fa` 进行计算。

<img width="308" alt="Screen Shot 2022-04-24 at 23 59 22" src="https://user-images.githubusercontent.com/24730006/164985190-f071ac85-579c-4d8d-8ceb-77f98e4a6bcb.png">

这一点尤其重要，尤其是在 create2 下计算地址时比较容易犯错，因为 create2 是需要取最后的 20 字节。

```go
// CreateAddress2 creates an ethereum address given the address bytes, initial
// contract code hash and a salt.
func CreateAddress2(b common.Address, salt [32]byte, inithash []byte) common.Address {
	return common.BytesToAddress(Keccak256([]byte{0xff}, b.Bytes(), salt[:], inithash)[12:])
}
```

---

原文：[GitHub Issue #253](https://github.com/islishude/blog/issues/253)
