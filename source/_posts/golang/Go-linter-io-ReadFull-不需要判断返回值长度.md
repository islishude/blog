---
title: 'Go linter: io.ReadFull 不需要判断返回值长度'
categories:
  - Golang
date: 2020-09-21 22:25:16
tags:
---

io.ReadFull 返回从Reader读取的字节数量和错误信息

```go
ReadFull(r Reader, buf []byte) (n int, err error)
```

ReadFull 经常出现在其它辅助函数中，比如随机数生成函数 `rand.Read`

```go
package rand

import "io"

var Reader io.Reader

func Read(b []byte) (n int, err error) {
	return io.ReadFull(Reader, b)
}
```

除了判断 err 是否不为空之外，经常有代码还会判断这个 n 的长度是否和 b 的长度一样，其实这是没必要的，io.ReadFull 内部保证了如果 err == nil 那么 n == len(b)。

如实现代码所示，如果 Reader 内字节长度小于所需长度那么一定会返回 EOF 错误或者 ErrUnexpectedEOF 错误。

```go
func ReadFull(r Reader, buf []byte) (n int, err error) {
	return ReadAtLeast(r, buf, len(buf))
}

func ReadAtLeast(r Reader, buf []byte, min int) (n int, err error) {
	if len(buf) < min {
		return 0, ErrShortBuffer
	}
	for n < min && err == nil {
		var nn int
		nn, err = r.Read(buf[n:])
		n += nn
	}
	if n >= min {
		err = nil
	} else if n > 0 && err == EOF {
		err = ErrUnexpectedEOF
	}
	return
}
```

使用下面实际代码运行来看，确实不需要判断返回长度

```go
package main

import (
	"bytes"
	"fmt"
	"io"
)

func main() {
	// 无数据 0 EOF
	{
		src := bytes.NewReader(make([]byte, 0))
		dsc := make([]byte, 40)
		fmt.Println(io.ReadFull(src, dsc))
	}

	// 数据不够 32 unexpected EOF
	{
		src := bytes.NewReader(make([]byte, 32))
		dsc := make([]byte, 40)
		fmt.Println(io.ReadFull(src, dsc))
	}

	// 数据正好 32 <nil>
	{
		src := bytes.NewReader(make([]byte, 32))
		dsc := make([]byte, 32)
		fmt.Println(io.ReadFull(src, dsc))
	}

	// 数据更多 32 <nil>
	{
		src := bytes.NewReader(make([]byte, 40))
		dsc := make([]byte, 32)
		fmt.Println(io.ReadFull(src, dsc))
	}
}
```