---
title: VSCode一些技巧和快捷键
categories:
  - tool
date: 2018-05-19 22:38:32
tags:
---
VSCode 一些技巧和快捷键

### 如何让 VSCode 打开文件始终在新标签页打开？

VSCode 有一个默认设定，单击一个右侧侧边栏的文件是预览模式，如果不输入任何任何文本就始终保持预览模式。

预览模式是的打开一个新文件，然后再打开一个新文件，第二个就会占用第一个窗口。详细信息可以查看：https://code.visualstudio.com/docs/getstarted/userinterface#_preview-mode

文件处于预览模式有个标识，就是标题栏的文件名称是斜体的，

如何关闭？在设置文件里设置 `workbench.editor.enablePreview` 为 false 即可，这是全局设置的，每次都是打开新 tab。

不过还有个简单的方式，那就是**双击新文件**就是不以预览模式打开。如果已经打开，那么**双击标题栏的文件名称**也可以。

VSCode 已经成为我日常开发必备的编辑器。昨天有写一直困扰我的 #162 新文件打开占用前文件窗口的问题（feature），下文说明个人常用的快捷键。

官方文档中有[一篇]( https://code.visualstudio.com/docs/getstarted/tips-and-tricks
)专门说明了这些技巧，比较友好的时候是，文档页面会根据系统类型来显示快捷键。

下面是一些我常用的，Windows 下的 Ctrl 大多时候相当于 Mac 下 Cmd，以下以 Windows 说明。

### 分栏和开闭侧边栏

一个视口最多分成3个，使用 `Ctrl+\`，如果我们要切换不同的工作分栏，可以使用 `Ctrl+1, Ctrl+2, Ctrl+3` 即对应第一、二、三个分栏。

![image](https://user-images.githubusercontent.com/24730006/37562068-a368bb26-2a99-11e8-9744-9fbf90ba35c3.png)

上图可以看到左侧有个文件列表的侧边栏，如果关闭的话，使用快捷键 `Ctrl+b`。

不同分栏有不同的窗口，那么我们可以使用 `Ctrl+tab` 进行切换，如下图所示。

![image](https://user-images.githubusercontent.com/24730006/37562213-c10288f2-2a9d-11e8-90b9-a5301d27dea0.png)

还有个前进后退导航的快捷键，比如使用 ctrl+click 进行点击查看函数定义的时候就直接跳转到其定义，返回的时候直接使用 Alt+left  或者 Alt+right 即可，Mac 下是 `Opt+-` 和 `Opt+Shift+-`。

### 快捷查找

这里的快捷查找不是 `Ctrl+f` 的查找功能，这里的快捷查找要比它方便的多。

有这样一个场景，比如说打开 index.js 后想打开 model.js 那么不需要在侧边栏找，只需要使用 `Ctrl+p` 需要 model.ljs 这个文件名，然后选择即可。

值得注意的是，我们还可以使用一些更具体的命令来查找。比如说 `:n` 转到第 n 行，`@` 查找相关函数，`>` 快捷设置。其它的操作符具体如下。

![image](https://user-images.githubusercontent.com/24730006/37562119-c176e60a-2a9a-11e8-8a72-664912416b28.png)

### 变量重命名

初始化变量后，如果想更改名称的话是个头疼的事情，需要把使用这个变量的地方统统修改一遍。不过在 VSCode 里面我们直接使用 `F2` 即可重命名即可。

### 移动和复制代码行

移动代码行

Windows 下 `Alt+Up` 或者 `Alt+Down`，在Mac 下就是  `Opt+↑` 和 `Opt+↓`

![image](https://user-images.githubusercontent.com/24730006/37562232-804b101c-2a9e-11e8-97f5-6b72339e2dc7.png)

复制代码行

到行前：Ctrl+Alt+Up，到行后：Ctrl+Alt+Down


### 其它

 多光标选择：在 Windows 下使用 `Alt+Click` 空白处，Mac 下就是 `Opt+Click`。撤销上一个选择就是 `Ctrl+U`
多行选择：Ctrl+Shfit+上下左右
选择当前行：`Ctrl+i`
预览Markdown：`Ctrl+Shift+v`
折叠代码块：`Ctrl+Shift+[` 以及 `Ctrl+Shift+]`
跳转到开始和结尾：Windows 下是 Ctrl+Home 和 Ctrl+End ，Mac 下就是 `Cmd+↑` 和 `Cmd+↓`