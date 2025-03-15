---
title: Node.js 常见错误解决方式
categories:
  - Node.js
date: 2018-07-31 18:03:12
tags:
---

## Unexpected end of JSON input while parsing near

npm install 出现 ”Unexpected end of JSON input while parsing near” 的错误。

运行 npm cache clean --force

## 国内网络慢？node-sass安装错误
使用`cnpm`进行安装，可以解决常见的 `node-sass` 遇到错误问题，另外还支持 gzip 压缩。当下载安装 Nodejs+npm 完成后可以使用以下命令安装。 #89 推荐使用yarn包管理工具替代npm 

```shell
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

凡是包缓存在国外亚马逊云上的都会 出现网络问题，所以开发推荐完成使用 `cnpm`，如果旧项目中存在 `node_moudles` 以及 `package-lock.json` 需要先删除后再使用 `cnpm install`

或者配置 npm 选择镜像

```
npm config set registry https://registry.npm.taobao.org
npm config set disturl https://npm.taobao.org/dist
npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
npm config set sass_binary_site https://npm.taobao.org/mirrors/node-sass/
npm config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs/
```

## 二进制包编译错误  msbuild.exe failed

如果你使用Windows进行开发，你可能遇到以下错误
```
gyp ERR! build error
gyp ERR! stack Error: `C:\Program Files (x86)\MSBuild\14.0\bin\msbuild.exe` failed with exit code: 1
gyp ERR! stack     at ChildProcess.onExit (C:\Users\chad.lee\AppData\Roaming\npm\node_modules\npm\node_modules\node-gyp\lib\build.js:276:23)
gyp ERR! stack     at emitTwo (events.js:106:13)
gyp ERR! stack     at ChildProcess.emit (events.js:191:7)
gyp ERR! stack     at Process.ChildProcess._handle.onexit (internal/child_process.js:204:12)
gyp ERR! System Windows_NT 10.0.10586
gyp ERR! command "C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\chad.lee\\AppData\\Roaming\\npm\\node_modules\\npm\\node_modules\\node-gyp\\bin\\node-gyp.js" "rebuild"
gyp ERR! cwd C:\dev\archon\webhooks\docs\node_modules\protagonist
gyp ERR! node -v v6.2.2
gyp ERR! node-gyp -v v3.3.1
gyp ERR! not ok
```

这是因为没有安装 C++ 的编译器造成的，具体方法——

### 安装 node-gyp
`cnpm install -g node-gyp`

### 安装 Visual C++ Build Tools

Windows的安装流程[点这里](https://github.com/nodejs/node-gyp#on-windows)，官方推荐安装的 `windows-build-tool`的node包进行自动安装配置build-tool，网络下载很慢，我这里不推荐。

- [下载安装](http://landinghub.visualstudio.com/visual-cpp-build-tools) Visual C++ Build Tools
- [下载安装Python2](https://www.python.org/downloads/)，不支持Python3
- 配置命令`npm config set msvs_version 2015`

## 配置本地预览服务器ip为0.0.0.0无法打开
Windows 是不支持把 liveloader 的 ip 配制成 0.0.0.0 的，不过有个在不改变配置的同时也能打开预览，那就是把 0.0.0.0 改成 localhost 即可。

有时候在Mac或者Linux上使用 shadowsocks 也会出现这种问题，使用上边的方式也可以解决。至于原因，博主还没有找到。
