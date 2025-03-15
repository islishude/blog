---
title: 推荐使用yarn包管理工具替代npm
categories:
  - Node.js
date: 2019-01-30 11:15:45
tags:
---

yarn确实很快！使用流程上特别爽！下载安装 [yarnpkg](https://yarnpkg.com)，并进行国内镜像配置

```shell
yarn config set registry https://registry.npm.taobao.org -g
yarn config set disturl https://npm.taobao.org/dist -g
yarn config set electron_mirror https://npm.taobao.org/mirrors/electron/ -g
yarn config set sass_binary_site https://npm.taobao.org/mirrors/node-sass/ -g
yarn config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs/ -g
yarn config set chromedriver_cdnurl https://cdn.npm.taobao.org/dist/chromedriver -g
yarn config set operadriver_cdnurl https://cdn.npm.taobao.org/dist/operadriver -g
yarn config set fse_binary_host_mirror https://npm.taobao.org/mirrors/fsevents -g
```

另外，yarn 还可以直接添加远程 git 的包！这个NPM是不支持的，已经不再维护的 Bower 也是支持的。

## 常用命令
#### 添加依赖包
```
yarn add [package]
yarn add [package]@[version]
yarn add [package]@[tag]
```
#### 升级依赖包
```
yarn upgrade [package]
yarn upgrade [package]@[version]
yarn upgrade [package]@[tag]
```

#### 移除依赖包
```
yarn remove [package]
```

#### 安装项目的全部依赖
```
yarn
```
#### yarn bin
`yarn bin` 将打印 yarn 将把你的包里可执行文件安装到的目录。
#### yarn run
类似npm run，此命令可以运行定义在package.json的script， 也可以像 `npx <package-cli-name>` 一样运行node_modules的可执行文件
#### yarn global
global关键字必须放在yarn后面，

- yarn add: 添加一个包用在你当前的项目里。
- yarn bin: 显示 yarn bin 目录的位置。
- yarn list: 列出已安装的包。
- yarn remove: 从你当前包里移除一个不再使用的包。
- yarn upgrade: 基于指定的范围把包升级到它们最新版本。

#### yarn info <package> [<field>]

这个命令会拉取包的信息并返回为树格式，包不必安装到本地。

```
yarn info react
```