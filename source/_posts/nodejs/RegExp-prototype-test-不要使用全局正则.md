---
title: "RegExp.prototype.test() 不要使用全局正则"
date: 2021-02-02 03:34:27
slug: "nodejs/RegExp-prototype-test-不要使用全局正则"
categories: ["Node.js"]
tags: ["Web"]
---

test() 方法接受一个字符串，如果匹配返回 true。

今天遇到一个坑，如下面所示：

```js
const regexp = /foo/g;

regexp.test('foo'); // true

regexp.test('foo'); // false
```

这是因为 regexp 对象内部有个 lastIndex 属性，每次运行都会改变这个 lastIndex 属性，使得正则对象从这个新的索引开始匹配。

所以上面的第二次正则匹配返回了 false。

如果要修改这种错误，可以手动设置 lastIndex 为 0。

```js
const regexp = /foo/g;

regexp.test('foo'); // true

regexp.lastIndex = 0;

regexp.test('foo'); // true
```

这样看起来就有些"丑陋"了，所以我觉得在实践中，最好使用局部声明正则，而不是全局声明正则。

```js
/foo/g.test('foo'); // true
/foo/g.test('foo'); // true
```

更正：这里不能用全局作用域前提是也用了全局标识符。

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag

---

原文：[GitHub Issue #248](https://github.com/islishude/blog/issues/248)
