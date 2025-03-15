---
title: Debian APT Nginx 各个版本的区别
categories:
  - Linux
date: 2018-05-19 22:53:19
tags:
  - nginx
---

使用用 ubuntu 安装 nginx 很简单，直接就两条命令。

```
sudo apt update
sudo apt install nginx
```

然后就会显示如下所示的内容：

![image](https://user-images.githubusercontent.com/24730006/36289809-061fbada-12fd-11e8-8cde-2a3b3a1a326e.png)

可以看到这里除了几个必要库依赖包（lib*)，还需要安装 `nginx` `nginx-common` `nginx-core`，那么这三个文件都有什么区别？

简单的使用 `apt show package-name` 就可以了解包的描述。
## nginx-common 包

>This package contains base configuration files used by all versions of
 nginx.

也就是说这个就是所有 nginx 的配置文件。

## nginx 包

>This is a dependency package to install either nginx-core (by default),
 nginx-full, nginx-light, or nginx-extras.

也就是说是 nginx-core 等的依赖包。

安装后查看安装内容，其实全部都是 Doc 文档。

```
➜  ~ dpkg-query -L nginx
/.
/usr
/usr/share
/usr/share/doc
/usr/share/doc/nginx
/usr/share/doc/nginx/copyright
/usr/share/doc/nginx/changelog.Debian.gz
```

那 nginx-full nginx-light nginx-extras 这三者是什么？

## nginx-*

nginx 一个重要的特点就是轻量级、模块化。所谓模块化就是主要的功能很少，添加的功能主要靠各个模块。

那么 `nginx-*` 就是含有不同模块的包，使用 `apt install nginx` 默认安装的是 `nginx-core` 。

`nginx-full` 包中默认包含了一下模块。

- 标准模块包含了：Core, Access, Auth Basic, Auto Index, Browser, Charset, Empty GIF, FastCGI,Geo, Gzip, Headers, Index, Limit Requests, Limit Zone, Log, Map, Memcached,Proxy, Referer, Rewrite, SCGI, Split Clients, SSI, Upstream, User ID, UWSGI。
- 可选模块包含了：Addition, Debug, GeoIP, Gzip Precompression, HTTP Sub, Image Filter, IPv6,RealIP, Stub Status, WebDAV, XSLT。
- 邮件相关模块包含了：Mail Core, IMAP, POP3, SMTP, SSL。
- 第三方模块包含了：Echo, Upstream Fair Queue, DAV Ext。

具体如下图

![image](https://user-images.githubusercontent.com/24730006/36290025-5a11f09e-12fe-11e8-8f6a-9f1813d34a89.png)

那么其它包 `nginx-light` 等可以直接使用 `apt show nginx-light` 显示具体内容。

## nginx 版本区别

如果我们用源码包安装会看到下面几个版本。

![image](https://user-images.githubusercontent.com/24730006/36290157-eaa56906-12fe-11e8-8872-651b67de44e1.png)

- Maintainline 开发版
- Stable 稳定版
- legacy 历史版本

具体就是其中文含义，在生产环境一般我们使用 Stable 版本。而在 APT 上也是此版本。
