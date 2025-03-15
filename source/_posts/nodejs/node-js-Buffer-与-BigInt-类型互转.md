---
title: 'node.js Buffer 与 BigInt 类型互转 '
categories:
  - Node.js
date: 2019-06-29 09:40:48
tags:
---

node.js 中的 Buffer 是使用 Uint8Array 实现的，所以可以认为是 Golang 中的 []byte 类型。

不过在 Golang math 包中 []byte 和 math.BigInt 类型是可以互转的。

```go
package main

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"math/big"
)

func main() {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		panic(err)
	}
	num := new(big.Int).SetBytes(buf)
	fmt.Println(bytes.Equal(buf, num.Bytes()))
	// Output:
	// true
}
```

在之前的 [BigInt 尝鲜](https://islishude.github.io/blog/2018/05/20/nodejs/JS-BigInt-%E5%B0%9D%E9%B2%9C/) 一文中，介绍了 BigInt 的用法，虽然 BigInt 和 TypedArray 没有直接互转的接口，但是提供了 `BigInt(param: string)` 的初始化方式，其中这里的 param 和 Math.Number 参数对应，可以传类如 "0xa" 16 进制字符串等。

```js
var x = BigInt("0xa");
x.toString(16);
// 'a'
```

那么这里就可以通过 16 进制字符串这个中间过程做 BigInt 和 Buffer 的互转。

```typescript
function BigIntToBuffer(bn: bigint): string {
  return "0x" + bn.toString(16);
}

function BufferToBigInt(buf: Buffer): bigint {
  return BigInt("0x" + buf.toString("hex"));
}
```

在 TypeScript 中 BigInt 和 Number 类型的表示方式一样，不是类的那种首字母大写，而是使用 `bigint`

而这个转换逻辑在 base58 包也有用到

https://github.com/isLishude/bs58js/blob/master/index.ts#L5-L11

```typescript
let x: bigint =
  hex.length === 0
    ? zero
    : hex.startsWith("0x") || hex.startsWith("0X")
    ? BigInt(hex)
    : BigInt("0x" + hex);
```

本文作为铺垫，接下来的文章会写一篇 Base58 相关的内容。
