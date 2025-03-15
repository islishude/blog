---
title: 'Go: 显式声明某个类型实现了一个接口'
categories:
  - Golang
date: 2019-09-04 08:01:53
tags:
---

Go 中没有面向对象的 implements 关键字，一个类型实现了一个接口是隐式的。

其实显式声明主要为了让编译器提前判断接口是否被实现而已。

所以在 Go 中还是有很多方式的。

如下所示 \*UserCacher 实现了 Cacher 接口

```go
// Cacher key-value for string
type Cacher interface {
	Get(string) (string, error)
	Set(string, string) error
}

// UserCacher users cacher
type UserCacher struct {
}

// Get value by key
func (u *UserCacher) Get(key string) (string, error) {
	return "", nil
}

// Set value by key
func (u *UserCacher) Set(key, value string) error {
	return nil
}
```

为了让编译器提前判断的话，可这样做：

```go
// Verify that *UserCacher implements Cacher
var _ Cacher = (*UserCacher)(nil)
```

或者在一个“构造函数”内实现：

```go
func NewUserCacher() Cacher {
	return &UserCacher{}
}
```
