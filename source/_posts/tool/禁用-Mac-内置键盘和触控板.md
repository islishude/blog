---
title: 禁用 Mac 内置键盘和触控板
categories:
  - tool
date: 2019-06-29 09:43:28
tags:
---

最近买了个键盘，大小刚好能放在 13 英寸的 MBP 上，这样打字就舒服了很多。但是存在一个问题，直接放在上面有时候会触发内置键盘的按键。

解决方式就是禁用内置键盘，找了好多解决方案，结果都不能使用，最后找到这个软件 [tekezo/Karabiner-Elements](https://pqrs.org/osx/karabiner/)。安装后会安装两个软件，一个 Karabiner-Elements 和 Karabiner-EventViewer，要禁用内置键盘只需要用到第一个软件即可。

使用十分简单，打开软件切换到 Device 标签页，在下方的 `Disable the built-in keyboard...` 选择外接键盘即可，这个设置会在外接键盘接入时候禁用内置键盘。

<img width="994" alt="屏幕快照 2019-03-25 上午11 10 24" src="https://user-images.githubusercontent.com/24730006/54893009-cffa9680-4eee-11e9-852e-654f9fc867ae.png">

顺便一提，这个软件是[开源](https://github.com/tekezo/Karabiner-Elements)的，使用中可以安心放行一些系统权限。

keyword: disable the built-in Macbook keyboard
