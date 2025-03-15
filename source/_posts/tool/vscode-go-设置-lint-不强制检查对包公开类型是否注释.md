---
layout: tools
title: vscode-go 设置 lint 不强制检查对包公开类型是否注释
date: 2019-03-15 10:58:50
tags:
  - vscode
  - go
---

vscode-go 插件使用 golint 作为默认代码风格检查工具，而 golint 需要对包公开类型等需要注释说明用途，而且必须以类型名称开头。

所以经常会遇到风格检查下面的错误：

```
exported function ... should have comment or be unexported
```

但是对于国内的公司而言，不能只用英语注释吧，或者中英文混杂的注释，如下所示：

```go
// Door is a door
type Door struct {}

// Dog is 狗的定义
type Dog struct {}
```

代码要定义一个们，所以我需要注释说明这是个门，想想都很滑稽。不过要具体说明用途的话，GoDoc 生成的文档对阅读代码的人而言还是很有帮助的，代码写完就是文档，以下图片是 context 包的文档，是不是特别清晰？

![image](https://user-images.githubusercontent.com/24730006/54120159-fc63dc80-4431-11e9-9289-2251f258926a.png)

不过要关闭这个还是可以的，vscode-go 插件提供了很多个可选的 lint，只要改成 golangci-lint 就可以关闭强制 lint。

![image](https://user-images.githubusercontent.com/24730006/54120348-6e3c2600-4432-11e9-808d-7298041a1ca3.png)

golangci-lint 还支持注释指令，比如说 golangci-lint 有个强制规则就是需要检查函数 error 返回值，但是有些函数只是为了实现某些接口，一直返回一个 nil error，这个时候再次检查就有些累赘了。

比如说 Hash.Write 函数为了实现 io.Writer 返回 (int, error)，但是 error 永远为 nil 的。

以 sha256 为例，可以看到 error 就是默认的 nil。

```go
func (d *digest) Write(p []byte) (nn int, err error) {
	nn = len(p)
	d.len += uint64(nn)
	if d.nx > 0 {
		n := copy(d.x[d.nx:], p)
		d.nx += n
		if d.nx == chunk {
			block(d, d.x[:])
			d.nx = 0
		}
		p = p[n:]
	}
	if len(p) >= chunk {
		n := len(p) &^ (chunk - 1)
		block(d, p[:n])
		p = p[n:]
	}
	if len(p) > 0 {
		d.nx = copy(d.x[:], p)
	}
	return
}
```

这个时候就可以加上注释指令，忽略这个错误检查。

```
package main

import (
	"crypto/sha256"
	"fmt"
)

func main() {
	h := sha256.New()
	h.Write([]byte("hello world\n")) //nolint: errcheck
	fmt.Printf("%x", h.Sum(nil))
}
```
