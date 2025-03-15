---
title: 'Go: 判断空字符串的性能比较'
categories:
  - Golang
date: 2019-01-23 10:32:39
tags:
---

字符串在 Go 内部中是一个结构体，一个字段记录长度，一个字段记录指针位置。

判断字符串为空最常见的是 `data == ""`  这样，之前我认为这里分配了一个空字符串会占用分配的时间，所以我把一些判断都改成了 `len(data) == 0` 这样就不用分配一个空字符串的空间了，效率应该会提升。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
        data := ""
	fmt.Println(unsafe.Sizeof(data)) // 输出 16
}
```

但最近我在 Go 源码中看到很多使用第一种判断是否为空的写法，这让我有点怀疑是否我的优化是否正确。

```go
package comp

func isEmptyString0() bool {
	var data string
	if data == "" {
		return true
	}
	return false
}

func isEmptyString1() bool {
	var data string
	if len(data) == 0 {
		return true
	}
	return false
}
````

测试后，发现二者在性能上几乎没有区别。

```go
package comp

import "testing"

func BenchmarkIsEmptyString0(b *testing.B) {
	for i := 0; i < b.N; i++ {
		isEmptyString0()
	}
}

func BenchmarkIsEmptyString1(b *testing.B) {
	for i := 0; i < b.N; i++ {
		isEmptyString1()
	}
}
```

测试输出：

```
goos: windows
goarch: amd64
pkg: github.com/islishude/test/str
BenchmarkIsEmptyString0-8    2000000000	   0.30 ns/op	   0 B/op   0 allocs/op
BenchmarkIsEmptyString1-8    2000000000	   0.30 ns/op	   0 B/op   0 allocs/op
PASS
ok  	github.com/islishude/test/comp1.541s
Success: Benchmarks passed.
```

结果一致，另外看到内存也都没有，这说明 go 在编译时已经对这个做了优化。
