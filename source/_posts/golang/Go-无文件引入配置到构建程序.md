---
title: Go 无文件引入配置到构建程序
categories:
  - Golang
date: 2019-06-29 09:51:30
tags:
---

程序运行时需要引入一些配置信息，比如需要一个 password 信息。

一般而言有两种方式：1. 使用环境变量 2. 使用配置文件

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	// 通过配置文件
	var mockFileConf = []byte(`
	{
		"password" : "conf password"
	}
	`)

	conf := make(map[string]interface{})
	if err := json.Unmarshal(mockFileConf, &conf); err != nil {
		panic(err)
	}
	fmt.Println(conf["password"].(string))

	// 通过环境变量
	fmt.Println(os.Getenv("APP_PASSWORD"))
}
```

运行结果：

```console
$ APP_PASSWORD="env password" go run main.go
conf password
env password
```

不过还可以通过硬编码到运行程序内进行，

```go
package main

import "fmt"

var (
	password string
)

func main() {
	fmt.Println(password)
}
```

通过使用 ldflags 参数传入 build 或者 run 里就可以了，

```console
$ go run -ldflags "-X main.password=password" main.go
password
```

具体参数说明：

```
-X importpath.name=value
	Set the value of the string variable in importpath named name to value.
	This is only effective if the variable is declared in the source code either uninitialized
	or initialized to a constant string expression. -X will not work if the initializer makes
	a function call or refers to other variables.
	Note that before Go 1.5 this option took two separate arguments.
```

importpath 这里是在 main 包，所以用的是 `main.password` ，假如是 `github.com/islishude/config` 这个包，那么对应就是 `github.com/islishude/config.password`。

有几点需要注意：

1 如果是多个配置的话需要使用空格分隔

```go
package main
import "fmt"

var (
	username string
	password string
)

func main() {
	fmt.Println(username, password)
}
```

```console
$ go run -ldflags "-X main.username=username -X main.password=password" main.go
username password
```

2 如果配置内容含有空格，那么需要使用引用。

```console
$ go run -ldflags "-X 'main.password=build password'" main.go
build password
```

3 只能使用 string 类型不支持其它类型

```
main.num: cannot set with -X: not a var of type string (type.int)
main.bl: cannot set with -X: not a var of type string (type.bool)
```

这一点很适合，服务端给特定用户生成特定安装包。也适合运维和开发分离的场景。
