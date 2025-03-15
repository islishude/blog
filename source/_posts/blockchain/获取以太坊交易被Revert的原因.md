---
title: 获取以太坊交易被Revert的原因
categories:
  - blockchain
date: 2020-09-21 22:17:24
tags:
---

Solidity 0.4.22 支持 require 和 revert 函数加上错误原因的字符串，如果交易被Revert将会返回这个字符串，并编码成 `Error(string)`。

```js
pragma solidity ^0.6.6;

contract Test {
    function test() public {
        revert("always failed");
    }
}
```

在测试环境中进行部署后，使用 eth_call 调用：

```json
{
	"id": "1",
	"jsonrpc": "2.0",
	"method": "eth_call",
	"params": [{
		"from": "0xF59fB9ff455c68627bd852d6FEb87Ba73398B9Aa",
		"to": "0x6cC7f0784587DE4c3Da4c74b01707a4d0A3B32a4",
		"value": "0x0",
		"gas": "0x2dc6c0",
		"gasPrice": "0x1",
		"data": "0xf8a8fd6d"
	},"latest"]
}
```

即可获取到返回结果：

```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d616c77617973206661696c656400000000000000000000000000000000000000"
}
```

可以看到返回的结果，是使用 Error 进行了 ABI 编码了，所以可以进行解码。


使用 Go 进行数据解析，如果所示：

```go
package main

import (
	"bytes"
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	rpcclient, _ := ethclient.Dial("http://127.0.0.1:8545")
	contract := common.HexToAddress("0x6cC7f0784587DE4c3Da4c74b01707a4d0A3B32a4")
	calldata := ethereum.CallMsg{
		From: common.HexToAddress("0xF59fB9ff455c68627bd852d6FEb87Ba73398B9Aa"), To: &contract,
		Gas: 300_000, GasPrice: big.NewInt(1), Data: hexutil.MustDecode("0xf8a8fd6d"),
	}

	result, _ := rpcclient.CallContract(context.Background(), calldata, nil)
	// Keccak256("Error(string)")[:4] == "0x08c379a0"
	if bytes.HasPrefix(result, []byte{0x08, 0xc3, 0x79, 0xa0}) {
		strtyp, _ := abi.NewType("string", "", nil)
		var errstr string
		_ = abi.Arguments{{Type: strtyp}}.Unpack(&errstr, result[4:])
		fmt.Println(errstr)
	}
}
```

最终返回 `always failed`，和预期的情况一致。

如果要查找历史交易的错误原因，可以在 `eth_call` 调用时，第二个参数传入交易被确认的高度即可。默认情况下，Geth 客户端仅保存最近的 128 块的信息，如果要获取更久远的交易，那么需要开启 `--prune=archive`。

在 go-ethereum 1.9.14 abi 中，原生提供了 revert 解码，升级之后，可以直接使用：

```go
data, _ := hex.DecodeString("...")
reason, _ := abi.UnpackRevert(data)
```

在 go-ethereum 1.9.15 后，eth_call 调用如果含有 Revert ，那么会直接返回含有错误的信息。在 OpenEthereum(parity) 中很久之前就返回错误了，但是没有给出详细的错误的字符串。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": 3,
    "message": "execution reverted: some error",
    "data": "0x08c379a000000000000000000..."
  }
}
```