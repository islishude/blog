---
title: "确定 stdout/stderr 是否已经被重定向"
date: 2023-12-30 16:17:18
slug: "golang/确定-stdout-stderr-是否已经被重定向"
categories: ["Golang"]
tags: ["Go"]
---

有个场景是当日志输出到屏幕时增加颜色，当输出到普通文件或者重定向就去掉颜色，因为颜色是通过 ANSII Code 控制的，看起来像是乱码一样。

在 Unix 中，万物皆文件，那么就可以通过读取文件属性确认。

例如在 go 代码中：

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	stat, _ := os.Stdout.Stat()
	if stat.Mode()&os.ModeCharDevice == os.ModeCharDevice {
		fmt.Fprintln(os.Stdout, "terminal")
	} else {
		fmt.Fprintln(os.Stdout, "pipe")
	}
}
```

```console
$ go run main.go         
terminal
$ go run main.go | tee   
pipe
```

---

原文：[GitHub Issue #259](https://github.com/islishude/blog/issues/259)
