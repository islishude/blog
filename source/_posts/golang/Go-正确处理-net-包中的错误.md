---
title: 'Go: 正确处理 net 包中的错误'
categories:
  - Golang
date: 2020-09-21 22:16:52
tags:
---


Go 网络开发中的常用的应用层协议库都是基于 net 标准库开发的，比如 gorilla/websocket 和 go-grpc，还有最常用的 http 库。

当请求一个不存在的 host 时会返回一个错误，如下所示

```console
$ cat main.go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	if _, err := http.Get("http://unknownhost.example"); err != nil {
		fmt.Println(err)
	}
}
$ go run main.go
Get "http://unknownhost.example": dial tcp: lookup unknownhost.example: no such host
```

这个错误本质其实是 `*net.DNSError`，在 Go 早期开发中，会经常使用接口断言匹配错误。

比如这样 `if v, ok := err.(*net.DNSError);ok {}` 的形式。

如果这样使用的话，实际上不会匹配断言匹配到，在 debug 模式可以看到最后返回其实是 `*url.Error`，然后内部才实际包裹了 `(*net.DNSError)` 错误，并实现 `Unwarp() error` 方法。

```go
// url.Error
type Error struct {
	Op  string
	URL string
	Err error // 上述例子中，这里包裹了 *net.DNSError 错误
}
```

在 go 1.13 之后，`errors.As` 可以进行解包错误，那么我们就可以直接使用下面方式即可：

```go
package main

import (
	"errors"
	"fmt"
	"net"
	"net/http"
)

func main() {
	if _, err := http.Get("http://unknownhost.example"); err != nil {
		if v := (*net.DNSError)(nil); errors.As(err, &v) {
			fmt.Println("can't found", v.Name)
		}
	}
}
```

除了 *net.DNSError 之外，还有下面内置错误结构体：

- net.InvalidAddrError
- net.UnknownNetworkError
- net.AddrError
- net.DNSConfigError

上面错误除了实现了 Error() 接口，还实现了 `Timeout() bool` 和 `Temporary() bool` 接口，也就是实现了 `net.Error` 接口

```go
// net.Error
type Error interface {
    error
    Timeout() bool   // Is the error a timeout?
    Temporary() bool // Is the error temporary?
}
```

同时也实现了 `Unwarp()` 接口，用于错误解包。那么我们就可以区分请求的错误是网络错误，还是服务器错误。

比如在 jsonrpc 协议中定义了 Error 结构体，使用下面方式进行判断

```go
type JsonError struct {
	Code int         `json:"code"`
	Msg  string      `json:"message"`
	Data interface{} `json:"data"`
}

func (e *JsonError) Error() string {
	return e.Msg
}

func main() {
	if _, err := jsonrpc.Call("http://jsonrpc.example"); err != nil {
		if v := (net.Error)(nil); errors.As(err, &v) {
			fmt.Println("is timeout?", v.Timeout())
			return
		}

		if v := (*Error)(nil); errors.As(err, &v) {
			fmt.Println("jsonrpc error: Code:", v.Code, "Msg", v.Msg)
		}
	}
}
```

如果按照以前的方式不断通过接口断言的解包错误的形式，那么代码很快会形成类似”回调地狱“的模样。

所以，在实际应用层开发上，直接可以使用 `fmt.Errorf("Stack: %w",err)` 包装错误，最后调用方最后使用 `errros.As` 或 `errros.Is` 解包按需处理错误。