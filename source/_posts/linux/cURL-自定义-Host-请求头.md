---
title: "cURL 自定义 Host 请求头"
date: 2020-12-26 08:40:35
slug: "linux/cURL-自定义-Host-请求头"
categories: ["Linux"]
tags: ["Linux", "Backend"]
---

有这样一个场景，服务端配置了下面的 nginx 

```
server {
    listen       80 443;
    server_name  example.com  www.example.com;
}
```

如果我们要本机或者其它机器直连ip进行测试，直接访问 127.0.0.1 或者 localhost 都是不行的，因为 nginx 会根据 http 请求 host 头来路由。

第一种解决方法，改 /etc/hosts 文件，将 example.com 固定到具体 ip 上，比如上面的 127.0.0.1 。这样是可以的，但是需要修改 host 文件。

另一种方式是使用参数直接指定 Host `curl --header "Host: example.com" http://127.0.0.1/`

这种方法在上述场景是行得通的，但是服务有重定向，那么这个注入的假 host 也会跟着后续重定向请求一起发送。

另一方面，这种方式不适用 HTTPS 场景，在 HTTPS 握手中，客户端要向服务端发送 SNI 表明要连接的服务，而使用上面方式，cURL 会验证服务端的证书 SAN 是否为 127.0.0.1 这个 IP 而不是 example.com DNS 名称。

本质上我们还是想直接通过类似第一种方式，直接拦截 DNS 解析，正好 cURL 提供了 `--resolve <host:port:addr[,addr]...>` 的方式，可以直接认为这是一种 /etc/hosts 的替代：

```
curl --resolve example.com:443:127.0.0.1 https://example.com/
```

另外还有一种方式，可以自定义请求的主机名到另一个主机名，下面的例子中，请求 `example.com:443` 的会直接请求到 `host-47.example.com:443`

```
curl --connect-to example.com:443:host-47.example.com:443 https://example.com/
```

更为具体的说明可以参考 cURL 作者的文章 [CURL ANOTHER HOST](https://daniel.haxx.se/blog/2018/04/05/curl-another-host/)。

手册中关于上面两个参数的说明：

```
--resolve <[+]host:port:addr[,addr]...>

Provide a custom address for a specific host and port pair. Using this, you can make the curl requests(s) use a specified address and prevent the otherwise normally resolved address to be used. Consider it a sort of /etc/hosts alternative provided on the command line. The port number should be the number used for the specific protocol the host will be used for. It means you need several entries if you want to provide address for the same host but different ports.

By specifying '*' as host you can tell curl to resolve any host and specific port pair to the specified address. Wildcard is resolved last so any --resolve with a specific host and port will be used first.

The provided address set by this option will be used even if -4, --ipv4 or -6, --ipv6 is set to make curl use another IP version.

By prefixing the host with a '+' you can make the entry time out after curl's default timeout (1 minute). Note that this will only make sense for long running parallel transfers with a lot of files. In such cases, if this option is used curl will try to resolve the host as it normally would once the timeout has expired.

Support for providing the IP address within [brackets] was added in 7.57.0.

Support for providing multiple IP addresses per entry was added in 7.59.0.

Support for resolving with wildcard was added in 7.64.0.

Support for the '+' prefix was was added in 7.75.0.

This option can be used many times to add many host names to resolve.

Added in 7.21.3.


--connect-to <HOST1:PORT1:HOST2:PORT2>

For a request to the given HOST1:PORT1 pair, connect to HOST2:PORT2 instead. This option is suitable to direct requests at a specific server, e.g. at a specific cluster node in a cluster of servers. This option is only used to establish the network connection. It does NOT affect the hostname/port that is used for TLS/SSL (e.g. SNI, certificate verification) or for the application protocols. "HOST1" and "PORT1" may be the empty string, meaning "any host/port". "HOST2" and "PORT2" may also be the empty string, meaning "use the request's original host/port".

A "host" specified to this option is compared as a string, so it needs to match the name used in request URL. It can be either numerical such as "127.0.0.1" or the full host name such as "example.org".

This option can be used many times to add many connect rules.

See also --resolve and -H, --header. Added in 7.49.0.
```

---

原文：[GitHub Issue #247](https://github.com/islishude/blog/issues/247)
