---
slug: "nodejs/解决macOS-Catalina-v10-15-无法编译c-扩展库的问题"
title: "解决 nodejs 在 macOS Catalina (v10.15) 无法使用 node-gyp 问题"
categories:
  - Node.js
date: 2020-09-21 22:30:06
tags: ["Web"]
---

升级到 macos v10.15 之后，nodejs无法正常编译 c++ 库，node-gyp 文档给了[解决方案](https://github.com/nodejs/node-gyp/blob/master/macOS_Catalina.md)，本篇是其的简短翻译。

---

当升级到 macOS Catalina 或者使用 Software Update 会造成 `node-gyp` 安装失败。一般在 `npm install` 的时候会遇到下面这个错误：

```console
gyp: No Xcode or CLT version detected!
```

## 使用 node-gyp v7

最新版本的 `node-gyp` 或许可以解决这个错误。如果你直接使用使用 `node-gyp` 你应该安装使用 node-gyp v7。

如果你在 `npm install` 中使用 node-gyp（注：npm install 一些 C++ 扩展），你应该使用全局安装的 node-gyp ：

- `npm config set node_gyp <path to node-gyp>` 或者
- 使用环境变量配置： `npm_config_node_gyp=<path to node-gyp> npm install`

注意，如果使用了这种方式，那么必须要注意更新 node-gyp 的版本。另外可以使用 `npm config delete node_gyp` 删除之前的配置。

## 使用老版本 node-gyp

当使用 v7 之前的老版本 node-gyp 可以按照下面流程进行。

### 确认是否在使用 macOS Catalina

```console
$ sw_vers
ProductName:	Mac OS X
ProductVersion:	10.15
BuildVersion:	19A602
```

如果 `ProductVersion` 低于 10.15 那么不要继续进行下面的操作，而是使用 [REAMDME.md](https://github.com/nodejs/node-gyp#on-macos) 这里的指南进行。

### 确定是否安装 `CLT` （acid test）

可以使用下面脚本确定是否安装了 `XCode Command Line Tools`

```sh
curl -sL https://github.com/nodejs/node-gyp/raw/master/macOS_Catalina_acid_test.sh | bash
```

如果测试成功，那么可以在项目里里面重新尝试 `npm install` 。

如果测试失败，那么需要先进行安装 `XCode Command Line Tools`。

有三种方式进行安装：

1. 从 App Store 安装 XCode(~7.6 GB) 
   1. 安装成功后 `xcodebuild` 应该打印 `XCode 11.1` 或更新
      1. 如果不是，需要从下载最新的版本
   2. 打开 Xcode
      1. 选择 **Preferences > Locations** 如果 `Command Line Tools` 选项为空，那么选择一<img width="798" alt="截屏2020-02-19下午8 04 35" src="https://user-images.githubusercontent.com/24730006/74833262-18674200-5354-11ea-8b23-a39e1f48a30c.png">
      2. 如果提示需要安装更多编译工具，那么允许其执行
   3. 当全部安装结束后，退出 xcode
   4. 运行 `sudo xcodebuild -license accept` 同意软件许可证协议（license term）
   5. 运行 `softwareupdate -l` 没有需要更新的软件
      1. 如果存在更新的软件，那么使用 **系统偏好设置 > 软件更新** 进行更新
   6. 运行 `xcode-select -version` 应该返回 `xcode-select version 2370` 或更新
   7. 运行 `xcode-select -print-path` 应该返回 `/Applications/Xcode.app/Contents/Developer`
   8. 然后再次运行 acid test 是否安装 `CLT` 的命令
      1.  如果仍旧测试失败，使用 `sudo xcode-select --reset` 没有任何输出是正常的，否则从第 7 步重新开始
2. 使用 `xcode-select --install` 命令最小安装
   1. 如果 acid test 失败，那么重新尝试 `xcode-select --install`
   2. 如果安装命令返回 `xcode-select: error: command line tools are already installed, use "Software Update" to install updates` 需要尝试删除 XCL 后重装。
   3. 等待安装成功...
   4. 运行 `softwareupdate -l` 没有需要更新的软件
      1. 如果存在更新的软件，那么使用 **系统偏好设置 > 软件更新** 进行更新
   5. 运行 `xcode-select -version` 应该返回 `xcode-select version 2370` 或更新
   6. 运行 `xcode-select -print-path` 应该返回 `/Applications/Xcode.app/Contents/Developer`
   7. 重新进行 acid test
   8. 如果还没有成功，那么运行 `sudo xcode-select --reset` 接着从第 1 步开始
3. 手动从苹果开发者中心下载
   1. 登录 https://developer.apple.com/download/more 选择下载最新的 Command_Line_Tools 下载
   2. 安装，然后进行 acid test

### 卸载重装 `XCL`

1. 运行 `sudo rm -rf $(xcode-select -print-path)` 没有输出为正常
2. 运行 `sudo rm -rf /Library/Developer/CommandLineTools`
3. 运行 `sudo xcode-select --reset`
4. 运行 `xcode-select --install`
5. 进行 acid test
   1. 如果仍旧没有测试成功
      1. `npm explore npm -g -- npm install node-gyp@latest`
      2. `npm explore npm -g -- npm explore npm-lifecycle -- npm install node-gyp@latest`
   2. 如果还没有测试成功，可以在 [node-gyp github issue](https://github.com/nodejs/node-gyp/issues/1927) 中反馈

---

原文：[GitHub Issue #224](https://github.com/islishude/blog/issues/224)
