---
title: 在Ubuntu上安装 Nodejs 以及配置 NPM
categories:
  - Node.js
date: 2019-01-30 10:48:53
tags:
---

# 编译安装nodejs最新版本
## 从 nodejs 官网下载最新源代码
[choose the newest Node](https://nodejs.org/en/download/current/),copy the url,and run like this: `wget https://nodejs.org/dist/v7.8.0/node-v7.8.0.tar.gz`.  

## 安装依赖以及编译
1. sudo apt-get install python2.7 #install python2
2. sudo ln -s /usr/bin/python2.7 /usr/bin/python #create soft link
3. cd /home/user/
4. tar -zxf nodejs.tar.gz
5. cd nodejs
6. sudo apt-get install build-essntial #install gcc compile
7. ./configure
8. make
9. sudo make install 

**编译安装较慢，建议使用下面的方式**  

# 使用 node 管理工具安装
1. sudo apt install nodejs-legacy //ubuntu 仓库默认安装的是低版本的的 nodejs
2. sudo apt install npm //安装npm也是低版本的
3. sudo npm install -g n
4. sudo n latest  //更多文档查看<https://github.com/tj/n>
5. npm config set registry https://registry.npm.taobao.org //永久设置npm registry为淘宝镜像
6. npm config get registry //测试 npm 镜像
7. npm install npm@latest //升级npm到最新版本

## 使用[nvm](https://github.com/creationix/nvm#install-script)
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
#或者
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
```
### 添加nvm命令到.bashrc
```shell
cd ~/.bashrc
# or ~/.bash_profile, ~/.zshrc, ~/.profile
export NVM_DIR="$HOME/.nvm" [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
# 验证安装
command -v nvm
```
### 安装Node
```shell
# latest version
nvm install node
# stable version
nvm install stable
```
# 使用[apt包](https://nodejs.org/en/download/package-manager/)进行安装

```shell
# stable version
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
# latest version
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**注意** 6.0稳定版本，我安装的时候这个没有npm，命令是 nodejs 开头的。最新版本没有这个问题。 

# 手动下载包并安装

在官网找到最新包，然后安装下面流程进行。

```shell
wget https://nodejs.org/dist/v9.10.1/node-v9.10.1-linux-x64.tar.gz
tar -zxvf node-v9.10.1-linux-x64.tar.gz -C /usr/local --strip-components=1 --no-same-owner
ln -s /usr/local/bin/node /usr/local/bin/nodejs
```

# 国内npm镜像设置
1. 临时使用：`npm --registry https://registry.npm.taobao.org install PACKAGE-NAME`
2. 永久设置：`npm config set registry https://registry.npm.taobao.org`
3. cnpm包：`npm install -g cnpm --registry=https://registry.npm.taobao.org`

## 官方镜像
npm config set registry https://registry.npmjs.org/

# npm避免系统权限
默认情况下，全局模块都安装在系统目录（比如/usr/local/lib/），普通用户没有写入权限，需要用到sudo命令。

可以在用户目录下新建配置文件`.npmrc`，然后创建npm目录，把PATH添加到这里即可
```
cd ~
vim .npmrc
prefix = /home/yourUsername/npm
mkdir ~/npm
export PATH=~/npm/bin:$PATH
```

