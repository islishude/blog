---
title: 'redis 安装清单 '
categories:
  - Linux
date: 2018-07-31 18:06:24
tags:
---

redis 推荐使用在 linux 下安装。

## 下载编译
打开 https://redis.io/download 选择稳定版本下载，按照下列方式进行编译安装。

```shell
mkdir down
cd down
wget http://download.redis.io/releases/redis-4.0.8.tar.gz
tar -zxvf redis-4.0.8
cd redis-4.0.8
make
sudo make install
which redis-cli
```
最后使用 which 命令就可以看到 redis-cli 被安装到 /usr/local/bin/redis-cli

## 使用配置文件启动

创建一个 redis/6379-redis.conf 

```conf
bind 127.0.0.1
port 6379
# 后台启动
daemonize yes
supervised no
logfile .
# 工作目录
# 即持久化目录
dir .
```

然后就可以使用配置文件启动

```
redis-server 6379-redis.conf
redis-cli
ping
```

配置文件模板在下载 redis tar 包中有，即 redis.conf 可以复制下来

```shell
cat redis.conf | grep -v "#" | grep -v "^$" | tee 6379-redis.conf
```

上述命令可以将配置文件模板中中的注释和空行去掉并重定向配置到一个新文件。
