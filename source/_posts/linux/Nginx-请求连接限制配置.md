---
title: Nginx 请求连接限制配置
categories:
  - Linux
date: 2019-01-30 11:50:41
tags:
---

通过 APT 等包管理工具安装的 nginx 默认也安装了请求限制模块 `limit_req_module` 和 `limit_conn_module` ，这两个官方模块可以配置客户端请求和者连接的数量。

那请求和连接有什么区别呢？

对于 HTTP 协议来说，其建立在 TCP 之上，1.0 版本一个 HTTP 请求就会产生一个 TCP 连接，对于1.1版本来说加入了 `keep-alive`  头部关键字可以串行复用了 TCP 请求，在 HTTP/2（包括SPDY）中，每个并发请求都被视为一个单独的连接，完全支持多路复用 TCP 连接。

所以说一个连接必定有一个请求，多个请求可能来源同一个连接。

## 设置语法

设置连接限制可以使用 limit_req_zone 以及 limit_req 两个指令来设置。

### 请求限制

limmit_req_zone 相当于初始化一个连接限制行为。

```
# limit_req_zone
Syntax:	limit_req_zone key zone=name:size rate=rate;
Default:	—
Context:	http
```

key 是指一个客户端的特征值，比如说 `$remote_addr` 指定以客户端IP来作为限制手段。

size 是指使用内存存储这些请求/连接池的大小限制，一般设置为10M即可。

rate 是指速率，比如说 `1r/s` 是每秒限制为一个请求。


例如：`limit_req_zone  $binary_remote_addr  zone=azone:10m rate=1r/s;`

定义好之后，就可以使用 limit_req 来对具体场景做限制，可以使用在 http,server 以及 location 区域。

```
# limit_req
Syntax:	limit_req zone=name [burst=number] [nodelay];
Default:	—
Context:	http, server, location
```

burst 设置最多有多少个请求可以延迟到队列，如果加上nodelay就会立即丢弃其它的都会被立即丢弃并返回503状态码。

### 连接限制

而 limit_conn_zone 和 limit_conn 则和上述配置差不都。

limit_conn_zone 和 limit_req_zone 的区别就是没有了 rate 速率的设置，相应的连接限制数量要在 limit_conn 指令下完成。

```
# limit_conn_zone
Syntax:	limit_conn_zone key zone=name:size;
Default:	—
Context:	http
```

```
# limit_conn
Syntax:	limit_conn zone number;
Default:	—
Context:	http, server, location
```

例如：

```
limit_conn_zone $binary_remote_addr zone=test:10m;
server {
       listen       80;
       server_name  _;

       location / {
               limit_conn test 1;
               limit_rate 300k;
       }
}
```

