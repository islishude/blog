---
title: 'Go: 按位清除运算符（bit clear)'
categories:
  - Golang
date: 2020-09-21 22:14:12
tags:
---

在 Go 语言中有个特殊的位运算符，使用 `&^` 符号表示，包含与操作和取反操作。

《Go语言圣经》里面有对此的描述，`z = x &^ y`，如果 y 中比特位为 1 那么 z 对应比特位值就是 0，否则 z 就使用 x 对应位置的比特位值。

这种解释方法太绕了，实际执行方式是 x 和 y取反后的值进行与操作。实际应用中，如果我们需要一次清除多个比特位的，就可以使用这个运算符。

如下所示，我们定义了类似 unix 文件权限的枚举值，如果我们需要移除 Read 和 Write 权限，那么可以这样做

```go
package main

import "fmt"

func main() {
	const (
		Read byte = 1 << iota
		Write
		Execute
	)

	var f1 = Read | Write | Execute
	var f2 = Read | Write

	var f = f1 &^ f2

	fmt.Printf("%03b &^ %03b = %03b\n", f1, f2, f)

	// Output:
	// 111 &^ 011 = 100
}
```