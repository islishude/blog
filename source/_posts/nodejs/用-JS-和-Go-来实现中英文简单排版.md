---
title: 用 JS 和 Go 来实现中英文简单排版
categories:
  - Node.js
date: 2018-05-19 22:33:13
tags:
  - golang
  - nodejs
---

业界最为标准的中英文排版格式，中文和英文之间加空格，中文和数字之间加空格。现在微信（安卓 6.6.2 测试版）已经支持。

<img width="421" alt="2018-01-27 6 45 38" src="https://user-images.githubusercontent.com/24730006/35471319-d05c82ac-0393-11e8-8c54-7b621d2ce4d8.png">

原理其实这个很简单，就是匹配相连接的中文和英文（包括数字），然后在中间加一个空格即可。接下来用 JS 和 Golang 实现。需要注意的是已经符合排版的就不需要加空格了。

匹配中文是用的 `[\u4e00-\u9fa5]`，一般而言的中文就都涵盖。

## Go 实现
```go
package main

import (
    "fmt"
    "regexp"
)

func main() {
    s := "我是渣渣辉，我是zhangjiahui，zhangjiahui 是我"
    g1 := regexp.MustCompile("([\u4e00-\u9fa5])(\\w)")
    g2 := regexp.MustCompile("(\\w)([\u4e00-\u9fa5])")
    s = g2.ReplaceAllString(g1.ReplaceAllString(s, "$1 $2"), "$1 $2")
    // 输出："我是渣渣辉，我是 zhangjiahui，zhangjiahui 是我"
    fmt.Println(s)
}

```

## JS 实现

```js
var s = "我是渣渣辉，我是zhangjiahui，zhangjiahui 是我";
const g1 = /(\w)([\u4e00-\u9fa5])/g;
const g2 = /([\u4e00-\u9fa5])(\w)/g;
// 输出："我是渣渣辉，我是 zhangjiahui，zhangjiahui 是我"
s = s.replace(g1,"$1 $2").replace(g2,"$1 $2");
```

这里需要注意的是大部分常用的中文都可以匹配到，因为超出了 `\uffff` 所以部分生僻的中文还匹配不到，可以按照需要进行扩增。JS 因为使用 UTF-16 编码，再使用的时候需要再加上 `u` 修饰符，例如如 `/\u{20BB7}/u.test('𠮷')`。

原文首发在我的 [GitHub 博客](https://github.com/isLishude/blog/issues/156)

## 更新
看到一篇文章，[JavaScript 正则表达式匹配汉字](
https://zhuanlan.zhihu.com/p/33335629)，这里需要修改一下正则，最近有一个新的 ES 提案中包含了一个 [unicode 转义](https://github.com/tc39/proposal-regexp-unicode-property-escapes)，语法为 `\p{…}`。Chrome 64 已经支持，兼容处理可以使用`@babel/plugin-proposal-unicode-property-regex` 和 `regexpu-core` 。

所以正则可以修改为 `/(\p{Unified_Ideograph})(\w)/gu`。

以前没接触过这个正则语法，Go 是已经支持了这种语法，所以 Go 的正则也需要改成这个。

不过我尝试了 `Unified_Ideograph` 这个就报错了，需要修改为 `Han` 就可以了。

```go
g1 := regexp.MustCompile("(\\p{Han})(\\w)")
g2 := regexp.MustCompile("(\\w)(\\p{Han})")
```

## 更新二

上述有个问题，`\w` 匹配任意的字母、数字和**下划线**，相当于`[A-Za-z0-9_]`。

```js
const g = /(\p{Unified_Ideograph})([A-Za-z0-9])|([A-Za-z0-9])(\p{Unified_Ideograph})/gu
let s = "apple iphone 6s是2016年由us设计在cn 的 fushikang制造"

s = s.replace(g, function (match, $1, $2, $3, $4) {
    const res = $3 && $4 ? $3 + " " + $4 : $1 + " " + $2
    return res;
})

console.log(s)
```

这里也改进了正则只需要使用一个，需要注意的是，那么使用替换原则的话，后面的组匹配是在第一二个匹配之后，所以要使用 `$3, $4`。
