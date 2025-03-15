---
title: Win10 Chrome播放视频非常卡顿？
categories:
  - tool
date: 2019-08-19 20:53:44
tags:
---

最近我发现用 WindowsChrome 的时候，播放视频非常卡顿，视频就像一帧一帧的播放一样，但是 Mac 下没有这样的问题。

找了好久的解决方案，重装 Chrome，禁用所有 Chrome 插件，安装新显卡驱动都试过，都没解决。

最后我尝试禁用了 Chrome 的硬件加速功能，没想到解决了。

最后给出具体解决方式：

打开 Chrome 设置，搜索“硬件”，关闭“使用硬件加速模式（如果可用）”，然后重启 Chrome。
