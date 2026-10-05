---
title: "golang generic nil check 泛型空指针检查"
date: 2023-08-02 15:02:59
slug: "golang/golang-generic-nil-check-泛型空指针检查"
categories: ["Golang"]
tags: ["Go"]
---

目前 golang 无法支持对泛型参数空检查，例如下面代码就会报错：

```go
func IsNil[T any](t T) bool {
	// invalid operation: t == nil (mismatched types T and untyped nil)
	return t == nil
}
```

解决方式只能把参数 T 改为指针：

```go
// Works now
func IsNil[T any](t *T) bool {
	return t == nil
}
```

但是如果我们需要写一个函数可以把任意参数转化为指针，比如 aws sdk  go v2中几乎所有参数都是指针类型，所以提供了一系列的[函数](https://pkg.go.dev/github.com/aws/aws-sdk-go-v2/aws)，例如取 string 指针：

```go
// String returns a pointer value for the string value passed in.
func String(v string) *string {
	return ptr.String(v)
}
```

如果写一个泛型的取指针的函数就会遇到上面 IsNil 的问题。

如果不使用 *T 参数的话，这里有一个取巧的方式，使用 refelct 包：

```go
func TakePoint[T any](t T) *T {
	if reflect.TypeOf(t) == nil {
		return nil
	}
	return &t
}
```

`reflect.TypeOf(i)` 如果参数 i 是 nil 那么也会返回 nil，所以可以利用这个特性解决这个问题。

附上一个简单的测试用例

```go
func TestTakePoint(t *testing.T) {
	if res := TakePoint[string]("string"); *res != "string" {
		t.Fatal("string")
	}

	if res := TakePoint[int](100); *res != 100 {
		t.Fatal("int")
	}

	if res := TakePoint[any](nil); res != nil {
		t.Fatal("fail nil")
	}
}
```

可以关注这个 [issue 22729](https://golang.org/issue/22729) 和 [issue 61489](https://golang.org/issue/61489) 进行跟进。

---

原文：[GitHub Issue #254](https://github.com/islishude/blog/issues/254)
