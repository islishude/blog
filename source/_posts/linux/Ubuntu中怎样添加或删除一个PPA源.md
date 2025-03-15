---
title: Ubuntu中怎样添加或删除一个PPA源
categories:
  - Linux
date: 2019-01-30 10:47:53
tags:
---

## PPA源

Personal Package Archives（个人软件包档案）是Ubuntu Launchpad网站提供的一项服务，允许个人用户上传软件源代码，通过Launchpad进行编译并发布为2进制软件包，作为apt/新立得源供其他用户下载和更新。在Launchpad网站上的每一个用户和团队都可以拥有一个或多个PPA。

PPA的一般形式是 

```
ppa:user/ppa-name  
```

添加之前请确定已经安装 Python 以及必要依赖：

```
sudo apt-get install software-properties-common
```

添加PPA源的命令为：

```
sudo add-apt-repository ppa:user/ppa-name
```

也可以打开【软件中心】->【软件源】->【其他软件】，选择添加，在弹出的窗口中AT行里输入ppa:user/ppa-name 格式的内容。

例如，要添加一个用户名为 certbot 的 certbot 源中，则命令为

```
sudo add-apt-repository ppa:certbot/certbot
```

添加好更新一下： 

```
sudo apt-get update
```

然后就可以运行 `sudo apt install certbot` 安装了。

删除命令格式则为：

```
sudo add-apt-repository -r ppa:user/ppa-name
```

如 

```
sudo add-apt-repository -r ppa:eugenesan/java
```
然后进入 `/etc/apt/sources.list.d` 目录，将相应 ppa 源的保存文件删除。

最后同样更新一下

```
sudo apt-get update
```
