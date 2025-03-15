---
title: Go语言结构体和JSON序列化
categories:
  - Golang
date: 2018-05-19 22:29:38
tags:
---

一个结构体（ struct ）就是一个字段的集合，而 type 的含义跟其字面意思相符。这有点类似 JS 中的对象。

```go
package main

import "fmt"

// Man struct statement
type Man struct {
	name string
	age  byte
}

func main() {
	// 直接按顺序声明
	a := Man{"lishude", 23}

	// 先定义后赋值
	var b Man
	b.name = "ade"
	b.age = 22

	// 类JS对象声明
	c := Man{name: "huaji", age: 233}
	fmt.Println(a, b, c)

	// 读取和设置类JS对象
	c.name = "dalao"
	fmt.Println(c.name)
       
        // 指针
        d := &Man{"haha", 20}
	fmt.Println(d.age)
}
```

## 匿名字段

匿名字段类似下面这种方式

```go
type Human struct {
	name string
	age int
	weight int
}

type Student struct {
        // 匿名字段
        // 那么默认Student就包含了Human的所有字段
        // 其实就是 `Human Human` 的形式
	Human  
        // 如果这里有Human 中的相同的字段那么按照最外访问原则
        // name string
	uid int
}

// 初始化赋值
s := Student{Human{"Mark", 25, 120}, 1}
// 下面输出等价于 `s.name`
fmt.Println(s.Human.name)
```

如果变量中的 Student 也有 Human 中的 name 字段，Go 不会重写而是优先最外层访问。`s.Human.name` 就是访问 `Human` 内的，`s.name` 就是访问 `Student` 内的。

## 结构体方法

golang 中不支持面向对象中的声明式写法，结构体方法类似面向对象中的方法声明。

这里在方法名前面定义 receiver 就是结构体的方法了。如果 receiver 使用的指针，在方法内部不需要使用 `*s` 也可。这里就是 golang 简洁的一面，如果是函数参数为结构体对象那么在方法内部不用写 * 也可以。

```go
func (s *student)setName(newName string) {
    s.name = newName
}
```

注意 go 中函数参数都是复制，不使用指针无法修改原始值。

## JSON 操作

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name   string `json:"name"`
	Age    int    `json:"age"`
	Salary int    `json:"salary,string"`
}

func (p Person) String() string {
	return p.Name
}

func main() {
	str := `{"name":"lishude","age":23,"salary":"13000"}`
	p := new(Person)
	if err := json.Unmarshal([]byte(str), p); err != nil {
		fmt.Println(err)
	}

	fmt.Println(p.Name, p.Age, p.Salary)

	p1 := Person{"myname", 22, 13000}
	res, _ := json.Marshal(p1)
	fmt.Println(string(res))
}
```

如上述中，Go 提供了简单的函数用来序列化和反序列化 JSON。

反序列化操作 `json.Unmarshal([]byte(str), p)` 第一个参数接收 `[]byte` slice，第二个参数不能是 nil，必须是一个指针。

JSON 中的字段类型按照 JS 的类型区分，比如说 JS 只支持 double64 的数字，在 Go 中相应的就是 float64。其它类型可以参照下面说明：

- bool, for JSON booleans
- float64, for JSON numbers
- string, for JSON strings
- []interface{}, for JSON arrays
- map[string]interface{}, for JSON objects
- nil for JSON null

其中 JSON object 也可以用 struct 。如果转换的 JSON 字符串中可能会出现不同的字段，这也要在 struct 中定义，Go 会将对应值初始化为零值，但是如果不定义的话就会报错。

序列化操作 ` json.Marshal(p1)` 接收一个对象，返回一个 `[]byte` 和  error。

这里的 Person struct 定义中使用标签，因为定义的字段名称和类型可能和 JSON 的结构不同，加上标签就能区分。 `json:"salary,string"` 在 Salary 字段是 int 类型，这里可以规定 JSON 字段是字符串类型，Go 会字段进行转换，当然这样定义了， JSON 中的相应字段必须是字符串了，否则会报错。

注意一点，struct 中所有字段参与反序列化操作的都必须是首字母大写，这是因为在 Go 中只有大写的才是可对外访问的。

当序列化结构体的时候，可以使用 `omitempty` 来忽略如果字段为空的情况，使用 `-` 直接忽略输出。

```go
type Person struct {
	Name   string `json:"username"`
	Age    byte   `json:"age"`
	Passwd string `json:"password,omitempty"`
	Omit   bool   `json:"-"`
}
```

如下面的情况，p2 没有 Passwd 字段，则不会输出到 JSON 中。

```go
func main() {
	p2 := new(Person)
	p2.Name = "p2"
	p2.Age = 22
	res, err := json.Marshal(p2)
	if err != nil {
		fmt.Println(err)
	} 
        // {"username":"p2","age":22}
	fmt.Println(string(res))
}
```

如果想要直接忽略，不管那个字段有没有值，那么就是用 `-` 即可。

如下所示，Omit 字段设置了值也不会输出到 JSON 中，但是 Passwd 和上面对比就能发现，只要其有值就输出到 JSON 中。

```go
func main() {
	p := new(Person)

	p.Name = "p2"
	p.Age = 22
	p.Omit = true
	p.Passwd = "password"
	res, _ := json.Marshal(p)
	// {"username":"p2","age":22,"password":"password"}
	fmt.Println(string(res))
}
```