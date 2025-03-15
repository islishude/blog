---
title: GET 请求可不可以附带 body？
categories:
  - Node.js
date: 2020-09-21 22:33:30
tags:
---

正常的认知中，GET 是不可以使用 body 的，如果要使用 body，可以转化成 querystring。

查了些资料，发现规范并没有[限制](https://stackoverflow.com/questions/978061/http-get-with-request-body)，但是实际使用是有很大区别的。


使用 Go 实现一个 Server，然后使用 curl(v7.54.0)，nodejs(v13.5.0)，go(v1.13.5) 来实验：

```go
package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		data, _ := ioutil.ReadAll(req.Body)
		fmt.Println(req.Method)
		fmt.Println(req.Header)
		fmt.Println(string(data))
		fmt.Println()
	})
	_ = http.ListenAndServe(":8000", nil)
}
```


使用 Go client

```go
package main

import (
	"io"
	"io/ioutil"
	"net/http"
	"strings"
)

func main() {
	var url = "http://localhost:8000/"
	var payload = strings.NewReader("hello,world")

	req, err := http.NewRequest(http.MethodGet, url, payload)
	if err != nil {
		panic(err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	_, _ = io.Copy(ioutil.Discard, resp.Body)
}
```

Server 正常打印。

使用 curl 

```
curl --location --request GET 'localhost:8000' --data-raw 'hello,world'
```

Server 正常打印，另外 Content-Type 也自动加上了 application/x-www-form-urlencoded。

使用 nodejs 的话，就有很大区别，GET 不会传递 body，而 POST 会。

```js
// nodejs version v13.5.0
var https = require('http');

var options = {
    'method': 'POST',
    'hostname': 'localhost',
    'port': 8000,
    'path': '/'
};

var req = https.request(options, function (res) {
    var chunks = [];
    res.on("data", function (chunk) {
        chunks.push(chunk);
    });

    res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
    });

    res.on("error", function (error) {
        console.error(error);
    });
});

req.write("hello,world");

req.end();
```

切换到 postman 实现，postman 是支持 GET with body 的。
