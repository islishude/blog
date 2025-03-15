---
title: Chrome 已经原生支持截图功能，还可以给节点截图
categories:
  - Node.js
date: 2019-01-30 11:39:46
tags:
---

昨天Chrome62稳定版释出，除了常规修复各种安全问题外，还增加很多功能上的支持，比如说今天要介绍的强大的截图功能。

## 直接截图

打开开发者工具页面，选择左上角的元素选择按钮（Inspect）

![image](https://user-images.githubusercontent.com/24730006/31750667-ff5367d0-b4b3-11e7-93d8-3540e7790fcf.png)

Windows 下按住 Ctrl，Mac 就按住 Command，然后在页面拖动选择区域即可。

![image](https://user-images.githubusercontent.com/24730006/31750740-75f4d61c-b4b4-11e7-823a-1a5f1e3541a5.png)

Chrome会自动使用下载方式进行存储，如下效果图，感觉还不错。

![image](https://user-images.githubusercontent.com/24730006/31750776-a826564c-b4b4-11e7-8af6-ba2cf7236b29.png)

## 给节点截图

比如说我们刚才手动截取的区域其实是一个Node节点，如果想完整截取这一部分，我们就需要使用节点截图功能。

![image](https://user-images.githubusercontent.com/24730006/31750836-ee28a26c-b4b4-11e7-8320-7a3b7f897f67.png)

首先在开发者工具里面选择节点，这个如上图所示直接点选HTML即可。

然后按下快捷键 Ctrl + Shift + p 打开命令工具，Mac下就是 Cmd + Shift + p，输入 node 选择 Capture node screenshot 即可。图片会自动下载。

![image](https://user-images.githubusercontent.com/24730006/31752571-2fb62e6c-b4be-11e7-95e1-754126ffed40.png)

那么我们真的不需要网页截图插件了，如果想截图整个网页，我们直接在根节点选取就可以了。

是不是很方便？

原文首发在我的 GitHub [博客](https://github.com/isLishude/blog/issues/125)
