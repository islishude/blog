---
title: Docker+Nodejs实践
categories:
  - Node.js
date: 2019-01-30 10:21:21
tags:
---

## 依赖
1. Docker 
2. Nodejs

## 步骤

### 1 

新建一个项目，安装 `express` 包。

然后新建一个 `index.js` ，一个简单的服务器环境就搭好了。

```js
const express = require("express");
const app = express();
const port = 3000;
app.get("/", function(req, res) {
  res.status(200).send("Hello,Docker.");
});

app.listen(port);

console.log("Starting at %s", port);
```

我们运行 `node index.js` 打开浏览器 `localhost:3000` 就能看到 `Hello,Docker` 的提示，现在退出。


### 2

保证安装 docker 最新版本，有些命令本文需要最新版本。

下载 node 的 docker 镜像，这里我们直接用最新的就可以，如果慢可以设置国内镜像，具体参照我以前的 docker 文章。

```bash
docker pull node
# 查看node的版本
docker run --rm node node -v
# v9.2.1
```

这里我用的 ` docker run --rm ` 指的是运行后即删除这个容器。

好了，我们在直接进行下一步操作。

在命令行工具中定位刚才新建的项目路径，我这里用的是 windows 的 PowerShell。 

![image](https://user-images.githubusercontent.com/24730006/33820889-89087aae-de8c-11e7-9ed5-08a0d3bec36c.png)

接着运行

```shell
docker run -d -p 3000:3000 --name index.js \
  -w /node --mount \
  type=bind,src=$PWD,dst=/node \
  node \
  node index.js
```

简单说说这条命令，指定本地 3000 端口到容器的 3000 端口，并指定容器当前的工作目录是 `/node`（当然会自动创建这个不存在的目录）。这里 `--mount` 代替了以前的  `-v` ，官方最佳实践也是这样的。

好了我们打开浏览器访问 `localhost:3000` 就能看到  `Hello,Docker` 的提示了。

由于 node 的特性，我们在修改文件的同时，并没有实时修改网页。

这里我们需要配置一些内容，这里因为错误理解踩了几个坑。

1. 错误理解0：发送 sighup 就可以重启 node 服务
2. 错误理解1：使用 npm scripts 管理启动

具体说说 npm scripts 这个，也就是 npm run 这个，比如说配置 start 和 restart 命令，然后使用 docker exec 运行 npm，

```json
{
  "start": "node index",
  "restart": "killall node && node index"
}
```

事实上，我运行之后我才反应过来，npm 是后台命令，而不是 docker 需要的前台命令，如果这样执行（看下方最后一行）容器就会运行之后就退出。

```shell
docker run -d -p 3000:3000 \
  -w /node --mount \
  type=bind,src=$PWD,dst=/node \
  node \
  npm start # 看这里
```

最后我想到了 pm2 这个神器，下载 pm2 然后只要配置 pm2 前台启动就好了，最后的配置。

```json
{
  "name": "html",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "start": "pm2 start index.js --no-daemon",
    "reload": "pm2 reload all",
    "stop": "pm2 stop all"
  },
  "dependencies": {
    "express": "^4.16.2",
    "pm2": "^2.8.0"
  }
}
```

这时候我们只要运行就可以了。

```shell
docker run -d -p 3000:3000 --name n4 \
  -w /node --mount \
  type=bind,src=$PWD,dst=/node \
  node \
  npm start
```

更新操作，更简单 `docker exec n4 npm restart`。

更进阶的内容，使用 Dockerfile + pm2 构建，放在以后再谈。
