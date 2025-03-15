---
title: 'Go: 声明即初始化'
categories:
  - Golang
date: 2019-01-23 10:13:02
tags:
---

因为分离编译的原因，在 C++ 中声明和定义是不同的概念。在其它语言中，定义和声明几乎没有区别。

```c++
extern int i; // 声明
int j = 0; // 定义
int h; // 定义并初始化
```

C++ 默认初始化的规则是在函数外定义的变量拥有初始值，而在函数内部没有。c++ 就是这么多规矩。如果不注意的话就会运行时错误。

在 JavaScript 因为动态类型的原因并不能默认初始化，所有变量未赋值则为 undefined。

```javascript
let i; // undefined
let j = 1;
```

如果使用 TypeScript 的话，需要开启 `strict: true`，如果不开启的不会直接进行 null check，就算是 undefined 也可以在代码中使用 。

```typescript
interface IPerson {
  name: string;
  age: number;
}

let student: IPerson = void 0;

function getName(std: IPerson) {
  return std.name;
}

// 这里会报运行时错误
getName(student);
```

而在 Go 中声明即初始化，如果没有初始化值，那么就会赋值为**零值**。

```
int     0
int8    0
int32   0
int64   0
uint    0x0
rune    0 // rune的实际类型是 int32
byte    0x0 // byte的实际类型是 uint8
float32 0 // 长度为 4 byte
float64 0 // 长度为 8 byte
bool    false
string  ""
```

而对于指针、函数、接口、切片、通道、字典（映射）的零值都是 nil。

有了零值在就很大程度避免了运行时错误。

```go
package main

type person struct {
	name string
	age  uint8
}

var p person

func main() {
	fmt.Println(p.name, p.age)
}
```

另外这种初始化是递归进行的。如果未指定任何值，则结构数组的每个元素都将其字段归零。

```go
type T struct {
	n int
	left *T
}
t := new(T) // t.n == 0, t.left == nil
```

通常 golang 初学者会犯 nil map 的错误，下面会报 `panic: assignment to entry in nil map` 错误。这里的 m 是 nil ，最终也会报运行时错误。

```go
func main() {
	var m map[string]string
	m["name"] = "test"
	fmt.Println(m["name"])
}
```

为什么声明了而没有赋初始值呢？因为 map 内部是一个引用类型的结构，如果 map 初始化需要使用 make 。

记住：最佳实践对于 slice map 和 channel 需要使用 make

这对于指针也同样适用，如果定义了指针而没有初始化指针值，那么也会报错。

```go

package main

import (
	"encoding/json"
	"fmt"
)

func main() {
        // 使用上面定义 person 结构
	var p *person

	var data = `{"name":"test","age":20}`
	err := json.Unmarshal([]byte(data), p)

	if err != nil {
		fmt.Println(err)
	}
}

```

那么这里就会打印错误：`json: Unmarshal(nil *main.person)`

避免这样的问题，就需要一个非 nil 指针，很简单，使用 new 函数即可。

```go
func main() {
	p := new(person)

	var data = `{"name":"test","age":20}`
	err := json.Unmarshal([]byte(data), p)

	if err != nil {
		fmt.Println(err)
	}
}
```

所以所有语言的最佳实践都是要始终初始化变量。

现在还有一个 gopher 可能遇到的问题，上面说 interface 接口会初始化为 nil。

比如说下面这个例子：

```go
package main

import (
	"fmt"
	"io"
)

func main() {
	var tmp io.Writer

	if tmp != nil {
		fmt.Println("tmp isn't nil")
	} else {
		fmt.Println("tmp is nil")
	}
}
```

输出的肯定是 tmp is nil。

但是我们改一下。把一个指针为 nil 的赋值为一个接口，那么这个接口也是 nil 吗？

```go
package main

import (
	"bytes"
	"fmt"
	"io"
)

func main() {
	var buf *bytes.Buffer
	var tmp io.Writer = buf

	if tmp != nil {
		fmt.Println("tmp isn't nil")
	} else {
		fmt.Println("tmp is nil")
	}
}
```

答案是输出 `tmp isn't nil`。

因为对于接口 interface 内部存储而言，一个字段存储类型一个字段存储内容。内容为 nil 的接口，本身并不是 nil。

