---
title: 'Go: 清空 Slice 的两种方法：[:0]和nil'
categories:
  - Golang
date: 2020-09-21 22:23:56
tags:
---

如果要清空一个slice，那么可以简单的赋值为nil，垃圾回收器会自动回收原有的数据。

```go
a := [1,2,3]
a = nil
fmt.Println(a, len(a), cap(a) // [] 0 0
```

nil slice 和普通 slice一样可以使用 cap len 内置函数，以及被 for range 遍历。本质和 empty slice 性质一样，零长度和零容量，当然也可以使用 append 操作。

但是如果还需要使用 slice 底层内存，那么最佳的方式是 re-slice：

```go
a := [1,2,3]
a = a[:0]
fmt.Println(a, len(a), cap(a) // [] 0 3
fmt.Println(a[:1]) // [1]
```

不过如果序列化成 json 时候，上述二者就不太相同了，nil slice 会编码成 `null`，而 empty slice 会编码成 `[]`。