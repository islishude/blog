---
title: "grep 命令中一些需要转义的特殊字符"
date: 2021-07-24 04:20:03
slug: "linux/grep-命令中一些需要转义的特殊字符"
categories: ["Linux"]
tags: ["Linux"]
---

比如有这样一段文本，需要匹配出中间 ETH 地址

```
to match ethereum address 0xbfcc591d028ac556ADD68b21A971fF7930D16384 test text
```

在 nodejs 中可以这样做 

```js
/0x[0-9a-zA-z]{40}/.exec(txt)
[
  '0xbfcc591d028ac556ADD68b21A971fF7930D16384',
  index: 23,
  input: 'match ethereum address 0xbfcc591d028ac556ADD68b21A971fF7930D16384 test text',
  groups: undefined
]
```

但是使用 grep 就不行，没有任何返回

```console
$ txt='to match ethereum address 0xbfcc591d028ac556ADD68b21A971fF7930D16384 test text'
$ echo $txt | grep -o '0x[0-9a-zA-z]{40}'
```

谷歌了一遍才发现， `{` 和 `}` 需要进行转义操作

```console
$ echo $txt | grep -o '0x[0-9a-zA-z]\{40\}'
0xbfcc591d028ac556ADD68b21A971fF7930D16384
```

继续尝试了几个操作符， `*` 这个不需要转义，而 `+` 和 `?` 需要转义才可以使用。

```console
$ echo "abc 123" | grep -o '[a-z]*'
abc
$ echo "abc 123" | grep -o '[a-z]\+'
abc
$ echo "abc 123" | grep -o '[a-z]\?'
a
b
c
```

为什么在编程语言中最常用的重复类符号在 grep 中需要转义使用？

因为 grep 使用的是基本正则规则（Basic RegEx，简称 BREs），其它正则规则还有 Perl 的正则表达式（Perl RegEx，简称PREs），而 BREs 不支持上述的重复类符号规则，为了支持这些新规则，并且保持后向兼容性，所以上面这些都需要进行先转义。

除了上面提到 `{`,`}`,`?`,`+` 几个重复类符号需要转义外，这几个 `|`,`(`,`)` 也需要进行转义操作。

```console
$ echo 'abc' | grep -o 'a\|b\|c'
a
b
c
$ echo '0x123' | grep -o '0x\(\d\+\)'
0x123
```

---

原文：[GitHub Issue #251](https://github.com/islishude/blog/issues/251)
