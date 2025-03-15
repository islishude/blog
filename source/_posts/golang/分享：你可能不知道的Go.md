---
title: 分享：你可能不知道的Go
categories:
  - Golang
date: 2019-08-27 15:01:39
tags:
---

> 本文是根据我在公司分享的《你可能不知道的 Go（上）》而整理的文章

本次分享的主题是《你不知道的 Go》，其实这个名称来源自《你不知道的 JavaScript》这本书，当然起这个名字有些“妄自尊大”，再者这次分享确实没有什么“高大上”的内容，只是一些大部分初学者不会注意到的盲点，所以之后我就改名为《你可能不知道的 Go》。（笑）

## Type

首先，第一个话题是 Go 中的类型。如下面的代码所示，我们声明了一个新类型 Number，当然平时我们都是声明一个新的 struct 或者 interface。

```go
type Number float64

var i float64
var j Number

// Error: cannot use i (type float64) as type Number in assignmentgo
j = i

// OK
j = Number(i)
j = 1.02
```

对于为什么 i 和 j 不能互相赋值，大部分 Gopher 都能说出，因为二者是不同的类型，而 Go 是强类型语言，不能隐式转换，所以二者不能进行赋值。

通过这个例子可以说明，在 Go 中使用 type 就可以声明一个新类型，而不同的类型名称就代表不同的类型，即使他们底层类型是一致的。到这里，基本上所有的文档或者教程都对此有基本的说明。

再说一个例子，如下所示：

```go
type Hash []byte
var i []byte
var j Hash

// OK!
i = j
j = i
```

Hash 类型 i 和 []byte 类型 j 应该是不同的类型，根据我们上一页的说明，二者应该是不能互相赋值的，为什么这里就没有编译错误？

回答这个问题很简单，因为我们自以为的结论是错的，这里的 i 和 j 是同一类型(identical)。

这样说，肯定会有人疑惑，为什么在这里就是同一类型的呢？因为 []byte 是一个未声明的类型，对于未声明的类型，他们是没有名字的，所以只要其底层类型一致就可以，比如上面的 slice，元素都是 byte ，所以二者是相同的类型，可以互相赋值。

为什么说 []byte 是未声明的类型，而 float64 则是已声明的类型，其实这个已经是定义好的了，我们可以在[官方文档](https://golang.org/pkg/builtin/)找到所有的已定义的类型。

![image](https://user-images.githubusercontent.com/24730006/63477901-fdf20000-c4b9-11e9-97c3-70911055c461.png)

这里补充一句，大家可以看到 int 也是定义的类型，而不是关键字，而在 Java 和 c++ 是关键字的，所以下面的代码是不会编译失败的，而且运行也是成功的：

```go
package main

import "fmt"

var int = "相信我，这里不会编译错误"

func main() {
	fmt.Println(int)
}
```

接着说未声明的类型。其它的比如 map array 等与其长度等定义相关，不能直接定义（长度的选择是无限的），所以这些都是未定义类型。我们可以在官方 [spec](https://golang.org/ref/spec#Type_identity) 找到如何判断未定义类型二者是否类型一致：

- 具有相同元素类型长度的 array
- 具有相同元素类型的 slice
- 具有相同键值类型的 map
- 具有相同元素类型和传送方向的 channel
- 具有相同字段序列 (字段名、类型、标签、顺序) 的匿名 struct
- 签名相同 (参数和返回值，不包括参数名称) 的 function
- ⽅法集相同 (方法名和方法签名相同和次序无关) 的 interface

不过上面还没有解释为什么 1.02 可以直接赋值给 Number。其实是因为 1.02 是一个**无类型**的浮点数字面量，注意这里的无类型是说没有类型名称。所以 1.02 可以代表底层类型为 float64 的 Number 类型，如果使用字符串字面量给其赋值就会编译失败。

关于这里可赋值性的概念，在[官方文档](https://golang.org/ref/spec#Assignability)中也有说明，基本就是上面所说明的内容，具体的大家可以看文档。

讲完这一段，大家就可以回答这个问题了，下面的的代码中赋值语句，哪个是对的，哪个是错的。

```go
type Type0 []string
type Type1 []string

var x []string
var y Type0
var z Type1

y = x
z = x
y = z
```

第一个， y = x 由于 x 是未声明类型，而且与 y 底层类型一致，所以是可赋值的；第二个和第一个的原因一样；第三个，不能赋值，因为 y 和 z 是不同的类型。

当然这种方式会有很大的困扰，如果就想定义一个代表 float64 的 Number 类型怎么办？

也很简单，可以使用类型别名，类型别名代表二者类型完全一致。

```go
type Number = float64
var i float64
var j Number
// OK
i = j
```

其类型方法也可以直接调用：

```go
package main

type Mutex struct {
}

func (m *Mutex) Lock()   {}
func (m *Mutex) Unlock() {}

type PtrMutex = *Mutex
type NewMutex = Mutex

func main() {
	var a PtrMutex
	a.Lock()

	var b NewMutex
	b.Lock()
}
```

在 go 也有内置的类型别名，比如说代表一个字节的 uint8 的别名就是 byte，而代表一个 unicode code pint 的就是 int32。

## Slice

今天的第二个主题是 Slice，也就是切片。首先大家看下这段代码，函数参数接收一个 slice，然后在函数内部进行 append，最后输出什么？

```go
package main

import "fmt"

func add(i []int) {
	i = append(i, 3)
}
func main() {
	i := []int{1, 2}
	add(i)
	fmt.Println(i)
}
```

这个其实在 Twiiter 上有过类似的投票，选择输出 `[1 2 3]` 居多，大多数人留言说 slice 是引用类型，应该会修改原有的数据。

最后的打印结果是 `[1 2]`，也就是说 slice 不是引用类型。准确地说，Go 里面参数传递只有拷贝传递，没有引用传递，更不会有引用类型之说。

其实 [slice](https://research.swtch.com/godata) 是一个称之为胖指针的数据结构。什么是胖指针？看下面这副图，这个是 slice 的内部结构，可以看到除了一个指针之外，还有长度和容量两个字段，记录指针对象额外信息的结构就可以称之外胖指针。

![go-slice](https://user-images.githubusercontent.com/24730006/63504675-9e6d1200-c504-11e9-9af5-47828a4d7791.png)

从这张图，然后我们再次分析下上一页的代码，由于 go 只有拷贝传递，所以 slice 内部的结构都会被赋值一份。当 append 的时候会插入一个元素，首先检查这里容量是否足够足够，这里因为直接定义的 slice 有两个元素，所以容量也是 2，所以会新开辟一块新的，然后函数内部 i 变量指向这块内存，而外部变量 i 还是指向原先的内存。

好了，如果我们假设有足够的容量呢，如下所示，append 会不会修改？也不会。

```go
package main

import "fmt"

func add(slice []int) {
	slice = append(slice, 1, 2)
}
func main() {
	slice := make([]int, 1, 10)
	add(slice)
	fmt.Println(slice)
}
```

为什么？append 增加元素的同时，一定会修改内部长度字段，而又因为 go 只有拷贝复制，长度变化不会影响到外部的长度，外部仍旧是长度为 1 的切片。

那如何修改 slice 呢？有两种方式，第一种传递指针，那么整体修改肯定会修改外部；另一种是大家常见的修改索引位置的值。

```go
package main

func main() {
	data := []string{"1", "2"}

	var changeItem = func(data []string) {
		data[0] = "10"
	}
	changeItem(data)

	var changeItemByPoint = func(data *[]string) {
		*data = append(*data, "3")
	}
	changeItemByPoint(&data)
}
```

除了现在这种使用 make 或者从数组内截取的或者使用字面量定义 slice，go 语言中还有一个结构也是 slice，那就是函数的可变参数。

如下所示，根据上述说明也会修改原有的结构。

```go
package main

import "fmt"

func main() {
	data := []string{"good", "evening"}
	test(data...)
	fmt.Println(data)
}

func test(args ...string) {
	args[0] = "hello"
	args[1] = "world"
}
```

那么如果我们简单的一个一个传递会怎么样？

```go
package main

import "fmt"

func main() {
	data := []string{"good", "evening"}
	test(data[0], data[1])
	fmt.Println(data)
}

func test(args ...string) {
	args[0] = "hello"
	args[1] = "world"
}
```

如果以这样方式传递的话，go 会先构建一个 slice，然后按照顺序存储参数，所以这种不会影响原有数据。

string 类似 slice，不过内部并没有 cap 容量这个字段，主要是因为字符串内部是不可变的。

![image](https://user-images.githubusercontent.com/24730006/63591923-d21e6980-c5e2-11e9-8652-fdd05d27e4f8.png)

通过上图的字符串内存结构可以看到，底层也是一个字节数组。

如果使用 for...range 的方式遍历字符串，每个元素是不是一个 byte 呢？这个不是的：

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	raw := "我喜欢Go语言"
	for i, v := range raw {
		fmt.Println(i, reflect.TypeOf(v), v)
	}
	// 0 int32 25105
	// 3 int32 21916
	// 6 int32 27426
	// 9 int32 71
	// 10 int32 111
	// 11 int32 35821
	// 14 int32 35328
}
```

根据输出，我们可以看到，每个元素都是 int32，根据我们上面所说明的，int32 有个别名是 rune，而 rune 是一个 unicode code point，可以表示字符。

如果想打印输入一个字符，而不是一个数值，那么可以使用 string 将 v 进行转换即可。

大家也注意到，虽然每个元素都是按照 rune 来输出的，但是索引却不是，如果我们要一个 rune 对应一个索引的话，可以使用下面的方式，将 string 转化为 []rune：

```go
package main

import (
	"fmt"
)

func main() {
	raw := "我喜欢Go语言"
	for i, v := range []rune(raw) {
		fmt.Println(i, string(v))
	}
	// 0 我
	// 1 喜
	// 2 欢
	// 3 G
	// 4 o
	// 5 语
	// 6 言
}
```

当然上面所说仅对 for...range 的方式有效，如果用 for 循环的方式，根据 string 长度，这个时候每个元素就会是 byte 类型。

## Error

go 的 error 是一个接口，接口的零值是 nil。

```go
type error interface {
        Error() string
}
```

其实大家也知道除了接口外，函数、指针等的零值也是 nil。

这个引发了一个问题，新手经常会犯的错误，也就是所谓的 `nil error != nil`。

我们看下面的代码：

```go
package main

import "fmt"

type MyError struct{}

func (e *MyError) Error() string {
	return "any error"
}

func test() error {
	var myErr *MyError
	return myErr
}

func main() {
	fmt.Println(test() == nil) // false
}
```

为什么呢？不是说指针的零值也是 nil 么？

我们先看下接口的内存接口，其实 go 中的接口结构类似 Java 中的对象，都包括元数据和数据的指针。

![image](https://user-images.githubusercontent.com/24730006/63593020-9507a680-c5e5-11e9-8b89-da7bcc2758be.png)

看到这里，我们再分析下之前的代码，test 函数中，myErr 是一个 MyError 类型的指针，但是这个数据并不是一个接口类型，需要进行转化成接口，那转换成接口怎么处理呢，就是上述我们说的填充元数据和数据的指针。

这样说大家就应该明白了，非接口的 nil 的数据在转换成接口的时候就不是 nil 了。

## Enum

今天的最后一个话题是枚举，大家应该都觉得这个很简单，没什么可说的。

嗯，确实是这样。不过，大家可以试试这个，说下面的所有枚举值是多少。

![image](https://user-images.githubusercontent.com/24730006/63593210-1d864700-c5e6-11e9-9b2c-f99664be8b21.png)

我觉得大多数人第一次看到这个应该懵逼的，当然我也是这样。

首先我们看下是否能编译，这里有多个 iota ，还有一个 float64 的枚举，实话讲，刚看到这个对于能不能编译我也不能确认。这里是能编译成功的。

然后再看具体的值，首先 x 一定是可以确认的，是 0，那么 y 呢？是 0 还是 1 呢？有经验的小伙伴一定知道还是 0。

那么知道这个的话，下面就好说了，a b c 分别代表 0 1 2。

接下来，下面的 d 已经定义，那么就是 1，那 e 呢，是 1 还是 2？正确答案是 1，因为 d 占据了 iota 为 0 的位置，f 那么就是 2。

接下来，g 是 100，那么 h 呢？正确答案是和 g 一样 100。之后 i 呢？ iota 又回到了正确的位置，代表其位置，变成了 5。

接下来，看最后一列，j 和 k 根据上面可以推断出为 0 和 1。那么 l 呢？正确的是 2，属于同一列的变量都是 iota 的位置的数据。

关于 iota 的说明，大家可以在 [spec](https://golang.org/ref/spec#Iota) 中找到详细说明，这里就不再赘述了。

OK，这就是今天所有分享的内容，感谢大家参加！
