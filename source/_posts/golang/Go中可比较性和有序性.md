---
title: Go中可比较性和有序性
categories:
  - Golang
date: 2020-09-21 22:32:01
tags:
---

什么是可比较性，简单来说就是可以使用比较运算符的类型具有可比较性。

比较运算符又分为等于、大于、小于等形式。可以使用等于和不等的那么就代表此类型具有可比较性。可以使用大于和小于的的类型，那么就说明此类型具有有序性。

一般而言：

- 布尔类型具有可比较性。两个布尔值相等，那么说明二者都是 true 或 false。
- 整型和浮点型这个大家都知道，同时具有可比较性和有序性。

可比较性有个前提，比较运算符两侧是可以互相赋值的，int 和 float64 都具有可比较性，但是二者不可以进行比较。

那么字符串呢？

字符串可以进行比较，也具有有序性，两个字符串相比较，会按照字节顺序一个接一个的按照字典序比较，如果都相同那么就相同。如果不相同，怎么比较大小？

不是按照长度，而是按照相同位置的大小决定。如下所示： a1 是小于 b 的。

```go
package main

import (
	"fmt"
)

func main() {
	var a = "a"
	var b = "b"
	var a1 = "a1"

	fmt.Println(a < b, a < a1, a1 < b) // true true true
}
```

指针是具有可比较性，两个指针如果指向同一个值，那么就相等，但是不具有有序性。

```go
package main

import (
	"fmt"
)

func main() {
	var i int

	var x = &i
	var y = &i

	fmt.Println(x == y) // true
}
```

channel 也具有可比较性，如果两个 channel 相等，那么代表二者创建时使用了同一个 make 或者二者都是 nil。

值得注意的是两个 nil 的 channel 如果不是相同类型，那是不可以比较的，我们上述所述的可比较行和有序性都建立在二者是具有相同的可赋值性。

```go
package main

import (
	"fmt"
)

func main() {
	var i chan int
	var j chan int
	var x chan string
	
	fmt.Println(i == j) // false
	fmt.Println(i == x) // 不能编译
}
```

数组是可以比较的，如果两个数组元素是可比较的，且具有相同长度和相同值，那么二者就是相等的，但数组不具有有序性。

slice 不同于数组，不能进行比较。

接口也具有可比较性，如果两个接口如果相等，那么具有相同的动态类型和值。

```go
package main

import (
	"fmt"
)

func main() {
	var x interface{} = (*int)(nil)
	var y interface{} = (*float64)(nil)

	fmt.Println(x == y) // false
	
	var i interface{} = 1
	var j interface{} = 1
	fmt.Println(i == j) // true
	
	var a interface{}
	var b interface{}
	fmt.Println(a == b) // true
}
```

如果接口底层类型是 slice 这种不可比较的会发生？目前1.14的编译器还无法编译时判断，这里会造成运行时 panic

```go
package main

import "fmt"

func main() {
	var x interface{} = []int{1}
	var y interface{} = []int{1}

	// panic: runtime error: comparing uncomparable type []int
	fmt.Println(x == y)
}
```

如果底层类型不同，但是都具有可比较性的两个接口值进行互相比较，那么不会报错，而是返回 false。

```go
package main

import "fmt"

func main() {
	var x interface{} = 1
	var y interface{} = 1.0

	fmt.Println(x == y) // false

}
```

一个接口值和一个非接口值，也是可以比较的，只要接口值的底层类型和值与非接口值相同，那么二者相等。

```go
package main

import "fmt"

func main() {
	var x interface{} = 1
	var y interface{} = 1.0

	fmt.Println(x == 1, y == "string") // true, false
}
```

如果结构体所有字段都是可比较的，那么也是可比较的，如果两个结构体的非空字段都是相等的，那么二者相等。

```go
package main

import "fmt"

func main() {
	var x = struct{ Name string }{"string"}
	var y = struct{ Name string }{"string"}
	fmt.Println(x == y) // true

	var a = struct{ _ int }{100}
	var b = struct{ _ int }{200}
	fmt.Println(a == b) // true
}
```

slice/map/function 都不能进行比较，但是可以和 nil 进行比较。

可比较性是非常重要的知识点，因为 map 类型的 key 必须是可比较的，所以有些面试题会出 map 的 key 可以是哪些类型，尤其会问，key 是否可以是 slice 和 interface{}。