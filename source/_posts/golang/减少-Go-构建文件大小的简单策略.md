---
title: 减少 Go 构建文件大小的简单策略
categories:
  - Golang
date: 2019-06-29 09:52:19
tags:
---

由于 go 编译程序自带运行时，所以一个简单的 hello,world 程序也会超过 1M 的大小

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello,world")
}
```

构建并查看编译后文件大小

```
$ go build -o 1.out main.go
$ du -h 1.out
2.0M   1.out
```

最近我发现一个技巧，通过加入 ldflags 指令就可以减少构建大小。

```
$ go build -o 2.out -ldflags '-w -s' main.go
$ du -h 2.out 1.out
1.6M    2.out
2.0M    1.out
```

减少了 400K 左右。

在 go [link](https://golang.org/cmd/link/) 文档中有 ldflags 的指令详细说明，这里就是说把 debug 信息全部移出了。

```
-s
	Omit the symbol table and debug information.
-w
	Omit the DWARF symbol table.
```
