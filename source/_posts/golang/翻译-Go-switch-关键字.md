---
title: '[翻译] Go switch 关键字'
categories:
  - Golang
date: 2019-01-30 10:10:23
tags:
---

# Switch

规范: https://golang.org/ref/spec#Switch_statements
Spec: https://golang.org/ref/spec#Switch_statements

Golang 的 `switch` 关键字十分灵活，比如说，你不需要像 C++、Java 等需要明确 break 每个分支判断。 
Go's ` switch ` statements are pretty neat. For one thing, you don't need to break at the end of each case.

```go
switch c {
case '&':
	esc = "&amp;"
case '\'':
	esc = "&apos;"
case '<':
	esc = "&lt;"
case '>':
	esc = "&gt;"
case '"':
	esc = "&quot;"
default:
	panic("unrecognized escape character")
}
```

[src/pkg/html/escape.go](http://golang.org/src/pkg/html/escape.go#L178)

## 不仅仅数值类型
## Not just integers

switch 关键字可以在任何类型中使用。
Switches work on values of any type.

```go
switch syscall.OS {
case "windows":
	sd = &sysDir{
		Getenv("SystemRoot") + `\system32\drivers\etc`,
		[]string{
			"hosts",
			"networks",
			"protocol",
			"services",
		},
	}
case "plan9":
	sd = &sysDir{
		"/lib/ndb",
		[]string{
			"common",
			"local",
		},
	}
default:
	sd = &sysDir{
		"/etc",
		[]string{
			"group",
			"hosts",
			"passwd",
		},
	}
}
```

## 不需要设置表达式再判断
## Missing expression

事实上你根本不需要设置任何表达式后再进行判断。如果没有表达式的话就代表 `switch true`，这更像没有 if-else 的清晰条件判断形式，比如说下面在 Effictive Go 的例子。
In fact, you don't need to switch on anything at all. A switch with no value means "switch true", making it a cleaner version of an if-else chain, as in this example from Effective Go:

```go
func unhex(c byte) byte {
	switch {
	case '0' <= c && c <= '9':
		return c - '0'
	case 'a' <= c && c <= 'f':
		return c - 'a' + 10
	case 'A' <= c && c <= 'F':
		return c - 'A' + 10
	}
	return 0
}
```

## Break 关键字
## Break

Go 中 `switch` 隐式的添加了 `break` ，不过在某些场景仍然有用。
Go's ` switch ` statements ` break ` implicitly, but ` break ` is still useful:

```go
command := ReadCommand()
argv := strings.Fields(command)
switch argv[0] {
case "echo":
	fmt.Print(argv[1:]...)
case "cat":
	if len(argv) <= 1 {
		fmt.Println("Usage: cat <filename>")
		break
	}
	PrintFile(argv[1])
default:
	fmt.Println("Unknown command; try 'echo' or 'cat'")
}
```

## Fallthrough 关键字
## Fall through

如果想继续判断下一个分支，那么需要使用 fallthrough 关键字。
To fall through to a subsequent case, use the ` fallthrough ` keyword:

```go
v := 42
switch v {
case 100:
	fmt.Println(100)
	fallthrough
case 42:
	fmt.Println(42)
	fallthrough
case 1:
	fmt.Println(1)
	fallthrough
default:
	fmt.Println("default")
}
// Output:
// 42
// 1
// default
```
另一个例子：
Another example:

```go
// Unpack 4 bytes into uint32 to repack into base 85 5-byte.
var v uint32
switch len(src) {
default:
	v |= uint32(src[3])
	fallthrough
case 3:
	v |= uint32(src[2]) << 8
	fallthrough
case 2:
	v |= uint32(src[1]) << 16
	fallthrough
case 1:
	v |= uint32(src[0]) << 24
}
```
[src/pkg/encoding/ascii85/ascii85.go](http://golang.org/src/pkg/encoding/ascii85/ascii85.go#L43)

fallthrough 必须要在判断表示区域最后位置，你不能像下面这样写：
The 'fallthrough' must be the last thing in the case; you can't write something like

```go
switch {
case f():
	if g() {
		fallthrough // Does not work!
	}
	h()
default:
	error()
}
```

不过你可以使用标签形式的 fallthrough
However, you can work around this by using a 'labeled' `fallthrough`:

```go
switch {
case f():
	if g() {
		goto nextCase // Works now!
	}
	h()
    break
nextCase:
    fallthrough
default:
	error()
}
```

另外需要注意 fallthrough 不适用于类型分支判断情况。
Note: `fallthrough` does not work in type switch.

## 多条件判断
## Multiple cases

如果你想使用多个值在同一个 case 评估表达式中，可以使用逗号分隔。
If you want to use multiple values in the same case, use a comma-separated list.

```go
func letterOp(code int) bool {
	switch chars[code].category {
	case "Lu", "Ll", "Lt", "Lm", "Lo":
		return true
	}
	return false
}
```

## 类型评估
## Type switch

你可以对（只能）万能类型 interface{} 进行类型判断。
With a type switch you can switch on the type of an interface value (only):

```go
func typeName(v interface{}) string {
	switch v.(type) {
	case int:
		return "int"
	case string:
		return "string"
	default:
		return "unknown"
	}
}
```
你也可以声明一个变量，这个变量的类型是每个判断成功分支的类型。
You can also declare a variable and it will have the type of each ` case `:

```go
func do(v interface{}) string {
	switch u := v.(type) {
	case int:
		return strconv.Itoa(u*2) // u has type int
	case string:
		mid := len(u) / 2 // split - u has type string
		return u[mid:] + u[:mid] // join
	}
	return "unknown"
}

do(21) == "42"
do("bitrab") == "rabbit"
do(3.142) == "unknown"
```

## 无操作表达式
## Noop case

有时候 case 里是没有任何代码，这看起来很奇怪，在其它语言中会继续往下进行判断，但是在 golang 中不是这样，每一个 case 表达式都会隐式添加 break 表达式。
Sometimes it useful to have cases that require no action. This can look confusing, because it can appear that both the noop case and the subsequent case have the same action, but isn't so.

```go
func pluralEnding(n int) string {
	ending := ""

	switch n {
	case 1:
	default:
		ending = "s"
	}

	return ending
}

fmt.Sprintf("foo%s\n", pluralEnding(1))  == "foo"
fmt.Sprintf("bar%s\n", pluralEnding(2))  == "bars"

```
