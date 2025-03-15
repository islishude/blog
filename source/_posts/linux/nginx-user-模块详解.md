---
title: nginx user 模块详解
categories:
  - Linux
date: 2018-05-19 22:51:54
tags:
  - nginx
---

nginx 运行后可以指定用户，比如说一个静态网页服务器的文件目录的不同的用户有不同的访问权限，使用 nginx 指定用户就可以有权限对此目录读写。

我其实很好奇怎么直接指定用户的，而且运行nginx的时候也没有需要输入密码之类旳。

在网上查找资料后有以下发现：

Nginx 主进程（master process）会以 root 权限运行，之后主进程会读取 `/etc/nginx/nginx.conf` 文件中的 user 模块的配置，nginx 会使用这个指定的用户启动工作进程（ worker process）。

那为什么主进程需要使用 root？因为只有 root 可以监听小于1024的端口号，通常 webserver 使用 80/443 端口，这也就是为什么需要 root 来运行了。如果要更改非root用户来运行，需要更改下面的文件用户和用户组，当然你也就不能使用 <1024 的端口了。 

- error_log
- access_log
- pid
- client_body_temp_path
- fastcgi_temp_path
- proxy_temp_path
- scgi_temp_path
- uwsgi_temp_path

好了，具体进程运行如下图所示。

![image](https://user-images.githubusercontent.com/24730006/33918362-d26099e0-dfed-11e7-9c84-9d9567b2f658.png)

这里可以看到 nginx 只有一个主进程和多个工作进程，主进程主要读取和评估配置文件正确性，以及管理工作进程。工作进程是真正的网络请求处理的进程。

如果主进程使用root运行，那么nginx 将会调用 setuid()/setgid() 去设置 user/group。如果 group 没有特别指定，那么 nginx 会使用 user 相同的名称设置 group。默认为 `nobody nogroup` 或者安装nginx的时候在  `./configure` 指定的  `--user=USER` 和 `--group=GROUP`

![image](https://user-images.githubusercontent.com/24730006/34400643-7f56ac3e-ebce-11e7-8f7a-d5aea792bfbf.png)

[配置语法](http://nginx.org/en/docs/ngx_core_module.html#user)：

```
Syntax: user user [group];
defualt: user nobody nobody;
Context: main
```

如果使用了 php 的话，那么同时还需要编辑 [php-fpm.conf](http://php.net/manual/en/install.fpm.configuration.php)

```conf
; Set permissions for unix socket, if one is used. In Linux, read/write
; permissions must be set in order to allow connections from a web server. Many
; BSD-derived systems allow connections regardless of permissions.
; Default Values: user and group are set as the running user
;                 mode is set to 0660
listen.owner = xxx
listen.group = xxx
;liseten.mode = 0660
```

参考：
1. [Running Nginx as non root user
](https://stackoverflow.com/questions/42329261/running-nginx-as-non-root-user)
2. [How do I change the NGINX user?](https://serverfault.com/questions/433265/how-do-i-change-the-nginx-user)