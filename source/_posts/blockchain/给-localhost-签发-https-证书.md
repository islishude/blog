---
title: 给 localhost 签发 https 证书
categories:
  - tool
date: 2019-01-30 10:09:45
tags:
---

本文介绍一个可以给 localhost 签发 https 证书的工具 mkcert，而且使用特别简单。

工具下载地址：
https://github.com/FiloSottile/mkcert/releases/latest

或者工具包管理工具：

```
# mac
brew install mkcert
```

然后两步就可以生成 localhost 证书

```
# 添加 CA 信任
mkcert -install
# 生成证书到当前目录
mkcert 127.0.0.1 localhost
```

这样就可以给 `localhost` 和 `127.0.0.1` 生成了一个证书，如果给其它域名，可以再往后面加参数即可。

然后重命名一下为 `key.pem` 和 `cert.pem` 测试一下效果。

```
127.0.0.1+1-key.pem 127.0.0.1+1.pem # rename -> key.pem cert.pem
```

使用 Nodejs 试一试

```js
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};

https
  .createServer(options, (req, res) => {
    res.writeHead(200);
    res.end("hello world\n");
  })
  .listen(8000);
```

使用 curl 看一下结果，都正常连接了。

```bash
curl https://localhost:8000
# hello,world
curl https://127.0.0.1:8000
# hello,world
```

然后再换成 golang 试一试

```go

package main

import (
	"io"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "hello world\n")
	})
	log.Fatal(http.ListenAndServeTLS(":8000", "cert.pem", "key.pem", nil))
}
```

也是正常连接的。
