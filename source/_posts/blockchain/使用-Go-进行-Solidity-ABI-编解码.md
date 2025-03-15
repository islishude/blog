---
title: 使用 Go 进行 Solidity ABI 编解码
categories:
  - blockchain
date: 2019-06-29 09:45:47
tags:
---

## 类型对应关系

| 类型             | Solidity | Go                 |
| ---------------- | -------- | ------------------ |
| 字符串           | string   | string             |
| 布尔             | bool     | bool               |
| 地址             | address  | common.Address     |
| 无符号整数       | uintN    | uintN 或 \*big.Int |
| 有符号整数       | intN     | intN 或 \*big.Int  |
| 固定长度字节数组 | bytesN   | [N]byte            |
| 动态长度字节数组 | bytes    | []byte             |
| 固定长度数组     | T[k]     | array              |
| 动态长度数组     | T[]      | slice              |
| 枚举             | enum     | uintN              |
| 映射             | mapping  | -                  |
| 结构体           | struct   | -                  |

备注：

- solidity 中 uintN 和 intN 类型如果和 go 内置类型名相同，那么就一一对应，否则就是 `*big.Int` 类型。比如说 Solidity `uint8` 对应 go 的 `uint8` 而 solidity 中 `uint256` 以及 `uint160` 等就对应 go `*big.Int` 类型
- 固定长度数组对应相应类型数组，比如 Solidity `int[2]` 对应 go 的 `[2]int`
- 动态长度数组对应相应类型的切片，比如 Solidity 的 `int[]` 对应 go 的 `[]int`
- 枚举对应一个无符号的整数，具体根据枚举数量，一般为 `uint8` 类型
- mapping 只能使用 storage 存储类型，不能作为函数参数和函数作用域变量，只能用于状态变量
- struct 结构体 ABI 编解码目前处于实验阶段

## 使用示例

```go
package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

/*
pragma solidity ^0.6.0;

interface ABI {
    function List(address owner) external view returns (address[] memory receiver, uint256[] memory values);
    function Value(address owner) external view returns (uint256 values);
}
*/

const RawABI = `[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "List",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "receiver",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "values",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "Value",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "values",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]`

func main() {
	parsed, err := abi.JSON(strings.NewReader(RawABI))
	if err != nil {
		panic(err)
	}

	{
		address := common.HexToAddress("0x80819B3F30e9D77DE6BE3Df9d6EfaA88261DfF9c")

		// Value 参数编码
		valueInput, err := parsed.Pack("Value", address)
		if err != nil {
			panic(err)
		}

		// Value 参数解码
		var addrwant common.Address
		if err := parsed.Methods["Value"].Inputs.Unpack(&addrwant, valueInput[4:]); err != nil {
			panic(err)
		}
		fmt.Println("should equals", addrwant == address)

		// Value 返回值解码
		var balance *big.Int
		var returns = common.Hex2Bytes("0000000000000000000000000000000000000000000000000000000005f5e100")
		if err := parsed.Unpack(&balance, "Value", returns); err != nil {
			panic(err)
		}
		fmt.Println("Value 返回值", balance)
	}

	// List 返回值编码
	{
		// 注意：字段名称需要与 ABI 编码的定义的一致
		// 比如，这里 ABI 编码返回值第一个为 receiver 那么转化为 Go 就是首字母大写的 Receiver
		var res struct {
			Receiver []common.Address // 返回值名称
			Values   []*big.Int       // 返回值名称
		}

		// {"Receiver":["0x80819b3f30e9d77de6be3df9d6efaa88261dff9c"],"Values":[10]}
		raw := common.Hex2Bytes("00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080819b3f30e9d77de6be3df9d6efaa88261dff9c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a")
		if err := parsed.Unpack(&res, "List", raw); err != nil {
			panic(err)
		}
		_ = json.NewEncoder(os.Stdout).Encode(&res)
	}
}
```
