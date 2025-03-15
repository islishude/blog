---
title: Go slice 技巧
categories:
  - Golang
date: 2020-09-21 22:24:34
tags:
---


翻译： https://github.com/golang/go/wiki/SliceTricks
---


## 追加

```go
a = append(a, b...)
```

## 复制

```go
b = make([]T, len(a))
copy(b, a)
// or
b = append([]T(nil), a...)
// or
b = append(a[:0:0], a...)  // See https://github.com/go101/go101/wiki
```

## 切割（cut)

```go
a = append(a[:i], a[j:]...)
```

## 删除

```go
a = append(a[:i], a[i+1:]...)
// or
a = a[:i+copy(a[i:], a[i+1:])]
```

## 不保护删除

```go
a[i] = a[len(a)-1] 
a = a[:len(a)-1]
```

注意：如果元素类型是指针或者一个结构体内含有指针，上述的切割和删除会有内存泄露的风险，被删除的元素仍然被 a 引用，而不被垃圾回收处理，下面的代码可以处理这些问题：

## 切割（内存安全）

```go
copy(a[i:], a[j:])
for k, n := len(a)-j+i, len(a); k < n; k++ {
	a[k] = nil // 或 T 的零值
}
a = a[:len(a)-j+i]
```

## 删除（内存安全）

```go
if i < len(a)-1 {
  copy(a[i:], a[i+1:])
}
a[len(a)-1] = nil // 或 T 的零值
a = a[:len(a)-1]
```

## 不保护顺序删除（内存安全）

```go
a[i] = a[len(a)-1]
a[len(a)-1] = nil
a = a[:len(a)-1]
```

## 扩张(expand)

```go
a = append(a[:i], append(make([]T, j), a[i:]...)...)
```

## 扩大(extend)

```go
a = append(a, make([]T, j)...)
```

## 过滤

```go
n := 0
for _, x := range a {
	if keep(x) {
		a[n] = x
		n++
	}
}
a = a[:n]
```

## 插入

a = append(a[:i], append([]T{x}, a[i:]...)...)

注意：第二个 append 会创建一个新底层存储的 slice，并复制之前 a[i:] 的元素到新 slice 内，然后再复制到 a 中。可以使用下面方式避免二次复制。

s = append(s, 0 /* use the zero value of the element type */)
copy(s[i+1:], s[i:])
s[i] = x

## 插入slice

a = append(a[:i], append(b, a[i:]...)...)


## 栈模式（push)

a = append(a, x)

## 栈模式（pop)

x, a = a[len(a)-1], a[:len(a)-1]

## 栈模式（Push Front/Unshift)

a = append([]T{x}, a...)

## 栈模式（Pop Front/Shift）

x, a = a[0], a[1:]

## 无内存分配过滤

下面方式重用了原有内存。

```go
b := a[:0]
for _, x := range a {
	if f(x) {
		b = append(b, x)
	}
}
```

如果元素必须进行垃圾回收，那么可以再使用下面方式：

```go
for i := len(b); i < len(a); i++ {
	a[i] = nil // or the zero value of T
}
```

## 翻转

```go
for i := len(a)/2-1; i >= 0; i-- {
	opp := len(a)-1-i
	a[i], a[opp] = a[opp], a[i]
}
```

或者

```go
for left, right := 0, len(a)-1; left < right; left, right = left+1, right-1 {
	a[left], a[right] = a[right], a[left]
}
```

## 洗牌算法

go1.10 之后可以使用 [math/rand.Shuffle](https://godoc.org/math/rand#Shuffle)

```go
for i := len(a) - 1; i > 0; i-- {
    j := rand.Intn(i + 1)
    a[i], a[j] = a[j], a[i]
}
```

## 批处理

```go
actions := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
batchSize := 3
batches := make([][]int, 0, (len(actions) + batchSize - 1) / batchSize)

for batchSize < len(actions) {
    actions, batches = actions[batchSize:], append(batches, actions[0:batchSize:batchSize])
}
batches = append(batches, actions)
```

结果

```
[[0 1 2] [3 4 5] [6 7 8] [9]]
```

## 去重

```go
import "sort"

in := []int{3,2,1,4,3,2,1,4,1} // any item can be sorted
sort.Ints(in)
j := 0
for i := 1; i < len(in); i++ {
	if in[j] == in[i] {
		continue
	}
	j++
	// preserve the original data
	// in[i], in[j] = in[j], in[i]
	// only set what is required
	in[j] = in[i]
}
result := in[:j+1]
fmt.Println(result) // [1 2 3 4]
```