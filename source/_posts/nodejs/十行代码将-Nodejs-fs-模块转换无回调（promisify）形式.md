---
title: 十行代码将 Nodejs fs 模块转换无回调（promisify）形式
categories:
  - Node.js
date: 2018-05-19 22:30:26
tags:
---

promisify 是指将 Node.js 回调风格的函数转化为 Promise 形式，这样就可以使用 `then().catch()` 的方式避免回调地狱。

那么什么 Node.js 回调风格呢？简单讲就是回调函数参数中的第一个参数必须是 error，其余是必要的参数。

举个例子。

`fs.open(path, flags[, mode], callback)` 中的 callback 第一个参数是 `err <Error>` ，最后才是必要参数`fd <integer>`，Node.js 内置包都是这种风格的。

那怎么简单的 promisify 呢？

在 util 包里面有一个函数就是专门 promisify 的，使用方式如下：

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Do something with `stats`
}).catch((error) => {
  // Handle the error.
});
```

那么我们只要遍历 fs 包找到其函数然后转化为 promise 函数即可。

具体代码如下：

```js
const fs = require("fs")
const { promisify } = require("util")
const isFunc = (fn) => ({}).toString.apply(fn).match(/\s(\w+)/)[1] === "Function"
const fsp = Object.create(null)
for (let fn in fs) {
    isFunc(fs[fn]) && (fsp[fn] = promisify(fs[fn]))
}
module.exports = fsp
```

嗯，算起来只有8行。

上面的代码只是将函数进行转换，而没有加上常量，下面代码进行了多处优化。

```js
const fs = require("fs")
const { promisify } = require("util")
const fsp = Object.create(null)
for (let fn in fs) {
    fsp[fn] = typeof fs[fn] === "function" ? promisify(fs[fn]) : fs[fn]
}
module.exports = fsp
```

在 Nodejs 10 中我们可以使用还在实验状态的 fs/promise 包。

```js
const fsp = require("fs/promise");
fsp.writeFile("test.md", "test");
```