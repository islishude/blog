---
title: Go 语言延迟调用和错误处理
categories:
  - Golang
date: 2018-05-19 22:25:27
tags:
---

Go 支持使用关键字 defer 创建函数内延迟语句（进栈），当函数在 return 之前，这些 defer 语句会按照先进后出执行（出栈）。

如下所示，在 test 函数 return 之前所有进入 defer 栈的语句都会先执行。

```go
package main

import (
	"fmt"
)

func main() {
	res := test(1)
	fmt.Println(res)
}

func test(a int) string {
	fmt.Println("0")
	defer fmt.Println("1")
	if a == 1 {
		return "2"
	}
	defer fmt.Println("3")
	return "3"
}
```

需要注意的是，编译器在到达 defer 语句的时候要进行确认参数值以及类型，分配堆栈等。下面这段代码输出的是 2 而不是 4，这是因为 i 已经进行了一次计算。[REF](https://tonybai.com/2018/03/23/the-analysis-of-the-param-evaluation-of-defer-functions/)

```go
// https://play.golang.org/p/dOUFNj96EIQ
package main

import "fmt"

func main() {
    var i int = 1

    defer fmt.Println("result =>",func() int { return i * 2 }())
    i++
}
```

不止如此，就算使用 go 关键字也是这样。

```go
package main

import (
     "fmt"
    "time"
)

func main() {
    var i int = 1

    go fmt.Println("result =>",func() int { return i * 2 }())
    i++
    time.Sleep(3*time.Second)
}
```

如果要改变这里的方式就要把这里的函数进行改成闭包即可。

```go
package main

import "fmt"

func main() {
        var i int = 1

        defer func() {
                fmt.Println("result =>", func() int { return i * 2 }())
        }()
        i++
}
```

另外这些 defer 语句不受错误的影响，之前入栈的 defer 会照样执行。

如下所示，在发生了除零错误后，之前调用的 `fmt.Println()` 函数依旧会执行，而后续的没有入栈的就不会调用了。

```go
func test2(x int) {
	defer fmt.Println("1")
	defer func() {
		// 除 0 错误
		fmt.Println(100 / x)
	}()
	defer fmt.Println("2")
}

test2(0)
// 1
// panic: runtime error: integer divide by zero
```

所以我们可以用来做资源释放和错误处理。

```go
func test3() error {
	// 如果发生错误 f 为空，err 不为空
	f, err := os.Create("defer.txt")
	if err != nil {
		return err
	}
	// 释放文件句柄
	defer f.Close()
	f.WriteString("Hello, World!")
	return nil
}
```

Go 没有 C 系语言的 `try...throw` 的形式，而是使用 panic 和 recover 的形式，而这两个都是内建函数。

panic 用于发出错误（恐慌），而 recover 用于接收 panic 的信息。捕获函数 recover 只有在延迟调⽤内直接调⽤才会终⽌错误，否则总是返回 nil。任何未捕获的错误都会沿调⽤堆栈向外传递。

```go
func throwsPanic() {
	defer func() {
		if x := recover(); x != nil {
			fmt.Println(x)
		}
	}()
	panic("panic func")
}
```

以上调用就会输出 `panic func`。如果是延迟调⽤中引发的错误，可被后续延迟调⽤捕获，但仅最后⼀个错误可被捕获。

```go
func test() {
	defer func() {
		fmt.Println(recover())
	}()
	defer func() {
		panic("defer panic")
	}()
	panic("test panic")
}
// defer panic
```

[补充](https://github.com/astaxie/build-web-application-with-golang/blob/master/zh/02.3.md#panic%E5%92%8Crecover)错误处理

> Panic 是一个内建函数，可以中断原有的控制流程，进入一个令人恐慌的流程中。当函数F调用panic，函数F的执行被中断，但是F中的延迟函数会正常执行，然后F返回到调用它的地方。在调用的地方，F的行为就像调用了panic。这一过程继续向上，直到发生panic的goroutine中所有调用的函数返回，此时程序退出。恐慌可以直接调用panic产生。也可以由运行时错误产生，例如访问越界的数组。 

> Recover 是一个内建的函数，可以让进入令人恐慌的流程中的goroutine恢复过来。recover仅在延迟函数中有效。在正常的执行过程中，调用recover会返回nil，并且没有其它任何效果。如果当前的goroutine陷入恐慌，调用recover可以捕获到panic的输入值，并且恢复正常的执行。

> 一定要记住，你应当把它作为最后的手段来使用，也就是说，你的代码中应当没有，或者很少有panic的东西。这是个强大的工具，请明智地使用它。