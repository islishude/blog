---
title: 解决macOS Catalina (v10.15)无法编译c++扩展库的问题
categories:
  - Node.js
date: 2020-09-21 22:30:06
tags:
---

升级到 macos v10.15 之后，nodejs无法正常编译 c++ 库，node-gyp 文档给了解决方案，本篇是其的简短翻译。


## 确认 Xcode 命令行工具是否安装

1. `/usr/sbin/pkgutil --packages | grep CL` 应该返回数据
2. `/usr/sbin/pkgutil --pkg-info com.apple.pkg.CLTools_Executables` 应该返回 `version: 11.0.0` 或之后版本。

如果都正常返回数据，那么你应该重新安装 node-gyp。

否则就需要安装 xcode 或者 xcode-common-line，第二个文件较小但可能不解决问题，那么就需要在 app store 安装 Xcode (大概8GB) 。

安装后，打开 xcode，选择  Preferences > Locations ，如果 Command Line Tool 为空，那么需要先选择一个。

<img width="798" alt="截屏2020-02-19下午8 04 35" src="https://user-images.githubusercontent.com/24730006/74833262-18674200-5354-11ea-8b23-a39e1f48a30c.png">

然后可以重新尝试安装 c++ 库。
