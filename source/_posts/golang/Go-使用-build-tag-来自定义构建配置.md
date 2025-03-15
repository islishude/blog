---
title: 'Go: 使用 build tag 来自定义构建配置'
categories:
  - Golang
date: 2019-08-19 20:50:21
tags:
---

通常我们会给每个产品环境设置不同的配置，比如 redis 要在开发环境就连接 localhost:6379，测试环境可能连接某一个主机的 redis。

配置文件通常会使用 env 或者 yml。这样每次构建包放在不同的环境就需要手写一套配置，开发也需要向运维提供配置文档。

最近在一直在用 python，项目通常都是使用 .py 作为配置，直接进行加载，写几份配置，在运行的时候通过命令行参数或者环境变量制定配置加载文件。这样子很大程度减少了开发和运维的沟通成本。

如果放在 go 里面是否可行？因为 go 是编译二进制包，也没有动态加载这么一说，那怎么实现？

这个可以使用 build tags 来自定义配置。

假设我们现在有两个环境，dev 和 prod，那么我们可以新建一个 config 文件夹，放入 dev.go 和 prod.go 两个文件，分别写入对应的配置，如下所示。同一个包，同样的变量名，但是不会因为重复声明和报错，因为这里加了 tag，如下所示：

```go
// +build dev

package config

// config list
const (
	Redis = "redis://127.0.0.1:6379/0"
)
```

```go
// +build prod

package config

const (
	Redis = "redis://192.168.0.1:6379"
)
```

在 main 包引入尝试以下：

```console
$ go build -o=test -tags=dev .
$ ./test
redis://127.0.0.1:6379/0
$ go build -o=test -tags=prod .
$ ./test
redis://192.168.0.1:6379
```

可以了！

gin-gonic 也有一个编译指令，用于把 encoding/json 包替换为处理速度更快 jsoniter 包，也是使用的构建 tag：`$ go build -tags=jsoniter .`，实现也很简单，一个加上 `// +build jsoniter` 另一个默认使用 `// +build !jsoniter` 。

这里 tag 前加上 ! 就代表非构建指令下的配置。

tag 常用于交叉编译的配置，例如有些文件针对 linux 而有些文件针对 windows，底层使用的系统调用是不同的，go 源码就包含了很多这样的构建指令：

一行中使用空格就代表“或”的关系，下面指的是在 `linux` 或者 `darwin` 环境中使用。

```
// +build linux darwin
```

如果要指定“与”的关系，那么可以使用`,`，下面就是指使用 “linux” 和 “cgo” 两个环境同时满足才使用。

```
// +build linux,cgo
```

当然可以分成多行，下面的指令表述和上面一致：

```
// +build linux
// +build cgo
```

更多还有 ignore 指令来忽略使用这个文件，更多可以查看[官方文档](https://golang.org/pkg/go/build/#hdr-Build_Constraints)，这里不在继续展开。
