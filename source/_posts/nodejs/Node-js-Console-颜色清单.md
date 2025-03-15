---
title: Node.js Console 颜色清单
categories:
  - Node.js
date: 2019-01-30 11:35:09
tags:
---

在 Node.js 中打印颜色很简单，就是加上一段字符串描述就可以了，例如：

```js
console.log('\x1b[36m%s\x1b[0m', info);  //cyan
console.log('\x1b[33m%s\x1b[0m: ', path);  //yellow
```
更多：

```
# 控制符
Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

# 前景色
FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

# 背景色
BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
```

需要注意的是，一但加上某一个颜色，之后所有的字符都会受到影响。

所以需要加上 `reset` 来清除颜色。

更强大的库可以使用 `https://github.com/chalk/chalk`