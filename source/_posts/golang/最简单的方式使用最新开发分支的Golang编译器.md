---
title: 最简单的方式使用最新开发分支的Golang编译器
categories:
  - Golang
date: 2019-08-19 20:51:17
tags:
---

使用如下的命令：

```shell
go get -v golang.org/dl/gotip
gotip download
gotip version
# go version devel +c485506 Fri Aug 16 19:54:57 2019 +0000 darwin/amd64
```

比如这里我就使用了 go1.13 的未发布的最新编译器，那么就可以使用一些 go1.13 才有的功能。

比如下面的数字分隔符：

```go
package main

import "fmt"

func main() {
	i := 1_100
	fmt.Println(i)
}
```

然后使用 `gotip run main.go` 就可以了。
