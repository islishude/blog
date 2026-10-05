---
title: "跨域 cross-origin 和跨站 cross-site 是不同的概念"
date: 2023-09-06 14:31:38
slug: "nodejs/跨域-cross-origin-和跨站-cross-site-是不同的概念"
categories: ["Node.js"]
tags: ["Web"]
---

跨域一般用于同源策略，不同的协议、主机以及端口都算作跨域：

- 协议不同 `http://example.com` 和 `https://example.com` 
- 主机不同，即使二级域名相同 `https://www.example.com` 和 `https://example.com`
- 端口不同 `http://example.com:80` 和 `http://example.com:8080` 

跨站一般用于 cookie 配置，不区分协议和端口：

比如 `www.example.com` 和 `example.com` 就是同站。

这并不是说不区分二级域名，例如很多带有国家顶级域名的 `.com.cn`，所以使用二级域名区分是行不通的。

严格意义上说，需要保证主机名后缀定义在 [公共后缀列表](https://publicsuffix.org/) 中。

例如，`github.io` 就被定义在这个列表中。

所以，`first.github.io` 和 `second.github.io` 不能算作同站。

另外 chrome 会发送 Sec-Fetch-Site 请求头来标识当前请求的来源：

- cross-site
- same-site
- same-origin
- none

---

原文：[GitHub Issue #255](https://github.com/islishude/blog/issues/255)
