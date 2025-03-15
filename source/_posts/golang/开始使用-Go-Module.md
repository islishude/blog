---
title: 开始使用 Go Module
categories:
  - Golang
date: 2019-03-20 10:42:47
tags:
---

# 开始使用 Go Module

Go 的包管理方式是逐渐演进的， 最初是 monorepo 模式，所有的包都放在 GOPATH 里面，使用类似命名空间的包路径区分包，不过这种包管理显然是有问题，由于包依赖可能会引入破坏性更新，生产环境和测试环境会出现运行不一致的问题。

从 v1.5 开始开始引入 vendor 包模式，如果项目目录下有 vendor 目录，那么 go 工具链会优先使用 vendor 内的包进行编译、测试等，这之后第三方的包管理思路都是通过这种方式来实现，比如说由社区维护准官方包管理工具 dep。

不过官方并不认同这种方式，在 v1.11 中加入了 Go Module 作为官方包管理形式，就这样 dep 无奈的结束了使命。最初的 Go Module 提案的名称叫做 vgo，下面为了介绍简称为 gomod。不过在 v1.11 和 v1.12 的 Go 版本中 gomod 是不能直接使用的。可以通过 `go env` 命令返回值的 `GOMOD` 字段是否为空来判断是否已经开启了 gomod，如果没有开启，可以通过设置环境变量 `export GO111MODULE=on` 开启。

目前 gomod 在 Go v1.12 功能基本稳定，到下一个版本 v1.13 将默认开启，是时候开始在项目中使用 gomod 了。

## Hello,World

Go 维护者 Russ Cox 写一个简单的库，用于说明 gomod 的使用，下文我将使用这个库开始介绍。

首先在个人包命名空间目录新建一个文件夹，然后直接使用 `go mod init` 即可。

```shell
mkdir $GOPATH/github.com/islishude/gomodtest
cd $GOPATH/github.com/islishude/gomodtest
go mod init
```

更新：现在不允许在 GOPATH 下使用 gomod，需要更改成以下命令：

```
mkdir -p ~/gopher/gomodtest
cd ~/gopher/gomodtest
go mod init github.com/islishude/gomodtest
```

这时可看到目录内多了 go.mod 文件，内容很简单只有两行：

```
module github.com/islishude/gomodtest

go 1.12
```

首行为当前的模块名称，接下来是 go 的使用版本。这两行和 `npm package.json` 的 `name` 和 `engine` 字段的功能很类似。

然后新建一个 `main.go` 写入以下内容，这里我们引用了 `rsc.io/quote` 包，注意我们现在还没有下载这个包。

```go
package main

import (
	"fmt"

	"rsc.io/quote"
)

func main() {
	fmt.Println(quote.Hello())
}
```

如果是默认情况下，使用 `go run main.go` 肯定会提示找不到这个包的错误，但是当前 gomod 模式，如果没有此依赖回先下载这个依赖。

```console
$ go run main.go
go: finding rsc.io/quote v1.5.2
go: finding rsc.io/sampler v1.3.0
go: finding golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
go: downloading rsc.io/quote v1.5.2
go: extracting rsc.io/quote v1.5.2
go: downloading rsc.io/sampler v1.3.0
go: extracting rsc.io/sampler v1.3.0
go: downloading golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
go: extracting golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
Hello, world.
```

因为包含 golang.org 下的包，记得设置代理。这个时候当前包目录除了 `go.mod` 还有一个 `go.sum` 的文件，这个类似 `npm package-lock.json`。

gomod 不会在 `$GOPATH/src` 目录下保存 `rsc.io` 包的源码，而是包源码和链接库保存在 `$GOPATH/pkg/mod` 目录下。

```console
$ ls $GOPATH/pkg/mod
cache      golang.org rsc.io
```

除了 `go run` 命令以外，`go build`、`go test` 等命令也能自动下载相关依赖包。

## 包管理命令

当然我们平常都不会直接先写代码，写上引入的依赖名称和路径，然后在 build 的时候在下载。

#### 安装依赖

如果要想先下载依赖，那么可以直接像以前那样 `go get` 即可，不过 gomod 下可以跟语义化版本号，比如 `go get foo@v1.2.3`，也可以跟 git 的分支或 tag，比如`go get foo@master`，当然也可以跟 git 提交哈希，比如 `go get foo@e3702bed2`。需要特别注意的是，gomod 除了遵循语义化版本原则外，还遵循最小版本选择原则，也就是说如果当前版本是 v1.1.0，只会下载不超过这个最大版本号。如果使用 `go get foo@master`，下次在下载只会和第一次的一样，无论 master 分支是否更新了代码，如下所示，使用包含当前最新提交哈希的虚拟版本号替代直接的 `master` 版本号。

```console
$ go get golang.org/x/crypto/sha3@master
go: finding golang.org/x/crypto/sha3 latest
go: finding golang.org/x/crypto latest
$ cat go.mod
module github.com/adesight/test

go 1.12

require (
	golang.org/x/crypto v0.0.0-20190313024323-a1f597ede03a // indirect
	rsc.io/quote v1.5.2
)
```

如果下载所有依赖可以使用 `go mod download` 命令。

#### 升级依赖

查看所有以升级依赖版本：

```console
$ go list -u -m all
go: finding golang.org/x/sys latest
go: finding golang.org/x/crypto latest
github.com/adesight/test
golang.org/x/crypto v0.0.0-20190313024323-a1f597ede03a
golang.org/x/sys v0.0.0-20190215142949-d0b11bdaac8a [v0.0.0-20190316082340-a2f829d7f35f]
golang.org/x/text v0.3.0
rsc.io/quote v1.5.2
rsc.io/sampler v1.99.99
```

升级次级或补丁版本号：

```shell
go get -u rsc.io/quote
```

仅升级补丁版本号：

```shell
go get -u=patch rscio/quote
```

升降级版本号，可以使用比较运算符控制：

```shell
go get foo@'<v1.6.2'
```

#### 移除依赖

当前代码中不需要了某些包，删除相关代码片段后并没有在 `go.mod` 文件中自动移出。

运行下面命令可以移出所有代码中不需要的包：

```shell
go mod tidy
```

如果仅仅修改 `go.mod` 配置文件的内容，那么可以运行 `go mod edit --droprequire=path`，比如要移出 `golang.org/x/crypto` 包

```shell
go mod edit --droprequire=golang.org/x/crypto
```

#### 查看依赖包

可以直接查看 `go.mod` 文件，或者使用命令行：

```console
$ go list -m all
github.com/adesight/test
golang.org/x/crypto v0.0.0-20190313024323-a1f597ede03a
golang.org/x/sys v0.0.0-20190215142949-d0b11bdaac8a
golang.org/x/text v0.3.0
rsc.io/quote v1.5.2
rsc.io/sampler v1.99.99
$ go list -m -json all # json 格式输出
{
        "Path": "golang.org/x/text",
        "Version": "v0.3.0",
        "Time": "2017-12-14T13:08:43Z",
        "Indirect": true,
        "Dir": "/Users/lishude/go/pkg/mod/golang.org/x/text@v0.3.0",
        "GoMod": "/Users/lishude/go/pkg/mod/cache/download/golang.org/x/text/@v/v0.3.0.mod"
}
{
        "Path": "rsc.io/quote",
        "Version": "v1.5.2",
        "Time": "2018-02-14T15:44:20Z",
        "Dir": "/Users/lishude/go/pkg/mod/rsc.io/quote@v1.5.2",
        "GoMod": "/Users/lishude/go/pkg/mod/cache/download/rsc.io/quote/@v/v1.5.2.mod"
}
```

#### 模块配置文本格式化

由于可手动修改 go.mod 文件，所以可能此文件并没有被格式化，使用下面命令进行文本格式化。

```shell
go mod edit -fmt
```

## 发布版本

发布包新版本和其它包管理工具基本一致，可以直接打标签，不过打标签之前需要在 go.mod 中写入相应的版本号：

```console
$ go mod edit --module=github.com/islishude/gomodtest/v2
$ cat go.mod
module github.com/islishude/gomodtest/v2

go 1.12

require (
	golang.org/x/crypto v0.0.0-20190313024323-a1f597ede03a // indirect
	rsc.io/quote v1.5.2
)
```

官方推荐将上述过程在一个新分支来避免混淆，那么类如上述例子可以创建一个 v2 分支，但这个不是强制要求的。

还有一种方式发布新版本，那就是在主线版本种加入 v2 文件夹，相应的也需要内置 go.mod 这个文件。

比如上述我们引入的 rsc.io/quote 包，其中 v3 版本是用内置文件夹，而 v2 使用的是 tag。

```console
$ tree .
.
├── LICENSE
├── README.md
├── buggy
│   └── buggy_test.go
├── go.mod
├── go.sum
├── quote.go
├── quote_test.go
└── v3
    ├── go.mod
    ├── go.sum
    └── quote.go
$ git tag -a
bad
v1.0.0
v1.1.0
v1.2.0
v1.2.1
v1.3.0
v1.4.0
v1.5.0
v1.5.1
v1.5.2
v1.5.3-pre1
v2.0.0
v2.0.1
v3.0.0
v3.1.0
(END)
```

根据上面的说明，想必你会看到一个问题，当我们升级主版本号的时候，要更改 module 名称，也就是上面所说的加上版本号，这就存在一个问题，如果我们要更新到主版本号的依赖就没有这么简单了，因为升级的依赖包路径都需要修改，**这个在其它语言包管理以及 Go 第三方包管理工具都不存在的一点**。

如下所示，升级 `rsc.io/quote` 到 v3 版本。注意一点，作为例子这里包作者对函数也加上了版本，其实大部分人是不会加的。这个模式叫做 `semantic import versioning`，也是备受争议，大多数人认为这个没有特别大的作用，而维护者则认为这是为了 Go 下一个十年的必要条件。

```go
package main

import (
	"fmt"

	"rsc.io/quote/v3"
)

func main() {
	fmt.Println(quote.HelloV3())
}
```

对于内部开发我觉得还挺好，让大家都了解，不要随意加入破坏性更新。

不过由于这个不讨喜功能，不同版本可以存在同一个包了。补充一句，对于 v0 和 v1 版本并不需要加入到 import path 内。

```go
package main

import (
	"fmt"

	q1 "rsc.io/quote"
	"rsc.io/quote/v3"
)

func main() {
	fmt.Println(quote.HelloV3())
	fmt.Println(q1.Hello())
}
```

## 从老项目迁移

从很多第三方的包管理工具直接迁移到 gomod 特别简单，直接运行 `go mod init` 即可。

如果没有使用任何第三方包管理工具，除了运行 `go mod init` 初始化以外，还要使用 `go get ./...` 下载安装所有依赖包，并更新 `go.mod` 和 `go.sum` 文件。

默认情况下，`go get` 命令使用 `@latest` 版本控制符对所有依赖进行下载，如果想要更改某一个包的版本，可以使用 `go mod edit --require` 命令，比如要更新 `rsc.io/quote` 到 v3.1.0 版本。

```shell
go mod edit --require=rsc.io/quote@v3.1.0
```

## 阅读更多

上面说到 dep 这个社区维护的准官方管理工具无奈结束使命被 gomod 替代，关于这段故事，你可以阅读这篇文章：[《关于 Go Module 的争吵》](https://zhuanlan.zhihu.com/p/41627929)

更多介绍：

- [官方维基](https://github.com/golang/go/wiki/Modules)
- [跳出 Go Module 的泥潭](https://colobu.com/2018/08/27/learn-go-module/)
- [初窥 Go Module](https://tonybai.com/2018/07/15/hello-go-module/)
