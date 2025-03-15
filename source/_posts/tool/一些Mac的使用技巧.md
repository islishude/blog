---
title: '一些Mac的使用技巧 '
categories:
  - tool
date: 2019-01-30 11:37:30
tags:
---

常用的复制文本是`Command+C`，相应的粘贴剪贴都是用的`Command`结合`xv`。

## 开发工具
Mac默认自带许多Runtime，比如说Ruby和Python，不过Git貌似就没有自带，这时候我们只要在Terminal里面运行`xcode-select --install`，这个命令就会下载很多必要的开发组件，比如说git。**当升级系统之后，最好重新运行以下这个重装。**因为可能升级系统了，这些包可能会丢失。

## Homebrew
### 安装
打开命令行运行

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```
### 国内镜像
```bash
cd /usr/local/Homebrew
git remote set-url origin https://coding.net/homebrew/homebrew
brew update
```
OK!

## Terminal设置代理
命令行环境不支持软件定义的代理，我们可以自己设置代理。一千我用windows的时候在git bash中也是可以这样设置的。
```bash
export http_proxy=""
export https_proxy=""

# delete proxy
unset http_proxy
unset https_proxy
```

## Terminal退出关闭窗口
在Terminal中默认是输入`exit`是退出但不关闭窗口，我们可以在菜单中选择偏好设置--shell进行设置。
![image](https://user-images.githubusercontent.com/24730006/29914167-214c912e-8e6a-11e7-959e-3f08235b442d.png)

## 浏览器手势
1. 双指左右滑 => 前进后退
2. 缩小 / 减小文字大小 => 两指捏合

## Delete快捷键
mbp只有退格键没有删除键，不过只要按`fn+backspace`就可以了。

## 拖拽或文本选择
网上说以前可以使用三指拖动实现这种功能，不过需要在设置--辅助功能--鼠标与触摸板--触摸板选项--启用拖移，这里我设置了我在Windows的习惯，双击然后拖动。不用三指拖动也是为了和一些三指触控板手势区分开。

![image](https://user-images.githubusercontent.com/24730006/29909222-6fb7a0f0-8e57-11e7-86da-915d46be7329.png)

## 触控板手势
用习惯之后，确实Mac要比Windows强大的多，因为屏幕小，所以都可以把应用全屏，然后用手势切换全屏应用。

![image](https://user-images.githubusercontent.com/24730006/29909284-ca6e9dc8-8e57-11e7-8889-053bc0d57de9.png)
