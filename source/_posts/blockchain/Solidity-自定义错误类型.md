---
title: "Solidity 自定义错误类型"
date: 2021-05-03 05:27:05
slug: "blockchain/Solidity-自定义错误类型"
categories: ["Blockchain"]
tags: ["Solidity"]
---

从 Solidity 0.8.4 开始，开始支持自定义错误。 #231 中说明了在 Solidty 中 `revert(string)` 调用会被 ABI 编码成 `Error(string)` ，因为 string 动态数据的存在，会消耗大量的 gas 费用。

新的自定义错误使用类似与 event 的定义方式，使用 error 声明符，可以使用 revert 进行调用，如下所示：

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

error Unauthorized();

contract VendingMachine {
    address payable owner = payable(msg.sender);

    function withdraw() public {
        if (msg.sender != owner)
            revert Unauthorized();

        owner.transfer(address(this).balance);
    }
    // ...
}
```

当然也可以使用带有参数的方式：


```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

/// Insufficient balance for transfer. Needed `required` but only
/// `available` available.
/// @param available balance available.
/// @param required requested amount to transfer.
error InsufficientBalance(uint256 available, uint256 required);

contract TestToken {
    mapping(address => uint) balance;
    function transfer(address to, uint256 amount) public {
        if (amount > balance[msg.sender])
            // Error call using named parameters. Equivalent to
            // revert InsufficientBalance(balance[msg.sender], amount);
            revert InsufficientBalance({
                available: balance[msg.sender],
                required: amount
            });
        balance[msg.sender] -= amount;
        balance[to] += amount;
    }
    // ...
}
```

最终数据会被编码成： `abi.encodeWithSignature("InsufficientBalance(uint256,uint256)", balance[msg.sender], amount)`

所以外部可以解析这个错误数据：

```js
import { ethers } from "ethers";

// As a workaround, we have a function with the
// same name and parameters as the error in the abi.
const abi = [
    "function InsufficientBalance(uint256 available, uint256 required)"
];

const interface = new ethers.utils.Interface(abi);
const error_data =
    "0xcf479181000000000000000000000000000000000000" +
    "0000000000000000000000000100000000000000000000" +
    "0000000000000000000000000000000000000100000000";

const decoded = interface.decodeFunctionData(
    interface.functions["InsufficientBalance(uint256,uint256)"],
    error_data
);
// Contents of decoded:
// [
//   BigNumber { _hex: '0x0100', _isBigNumber: true },
//   BigNumber { _hex: '0x0100000000', _isBigNumber: true },
//   available: BigNumber { _hex: '0x0100', _isBigNumber: true },
//   required: BigNumber { _hex: '0x0100000000', _isBigNumber: true }
// ]
console.log(
    "Insufficient balance for transfer. " +
    `Needed ${decoded.required.toString()} but only ` +
    `${decoded.available.toString()} available.`
);
// Insufficient balance for transfer. Needed 4294967296 but only 256 available.
```

更多信息参考官方博客：https://blog.soliditylang.org/2021/04/21/custom-errors/

---

原文：[GitHub Issue #250](https://github.com/islishude/blog/issues/250)
