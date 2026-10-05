---
title: "cURL 响应状态码的相关例子"
date: 2020-11-17 14:31:52
slug: "linux/cURL-响应状态码的相关例子"
categories: ["Linux"]
tags: ["Linux"]
---

1. 怎么获取返回 HTTP 状态码

`curl -I` 可以返回响应头，当然也就包含了响应状态码。

如果想只要状态码，那么可以这样做：

```sh
$ curl -sS -w "%{http_code}" -o /dev/null https://www.baidu.com
200
```

如果请求失败，那么返回 `000`

2. HTTP 响应状态码 500/400 那么 curl 运行是否也是失败？

否

```sh
$ cat main.go && go run main.go&
package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(500)
	})
	log.Println("listen and serving...")
	_ = http.ListenAndServe(":8080", nil)
}
$ curl locahost:8080 
$ echo $?
0
```

如果想要 shell 返回错误码，可以加上 `-f` 参数，非 200 会返回 shell 22 error code

---

原文：[GitHub Issue #243](https://github.com/islishude/blog/issues/243)
