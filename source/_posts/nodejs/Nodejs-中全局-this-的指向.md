---
title: "Nodejs 中全局 this 的指向"
date: 2020-11-18 02:57:52
slug: "nodejs/Nodejs-中全局-this-的指向"
categories: ["Node.js"]
tags: ["Web"]
---

Nodejs 现在支持两种模块机制，一种是 CommonJS，一种是官方规范 ECMAScript 模块。

全局 this 在 CommonJS 不是指向 global(或者说 globalThis)，而是指向 module.export。

```js
console.log(this === module.exports); // true
```

这是因为 CommonJS 本质上是用函数包裹当前文件生成的一个作用域，所以能用作命名隔离。

```js
(function(exports, require, module, __filename, __dirname) {
    // Module code actually lives in here
});
```

当这个函数运行时，本质上是用了 `wrapfunc.apply(module.exports)` 这种差不多的形式，所以最终模块内部，全局 this 指向 `module.exports`。

比如常见在 TypeScript 中的 import helper 函数，用于给模块暴露一个 default 接口给 ESModule 使用。

```js
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
```

而在 ESModule 中，全局 this 指向 undefined，同时我们也就可以通过下面这个等式判断当前模块是 ES 模块。

```mjs
console.log(this === undefined); // true
```

---

原文：[GitHub Issue #244](https://github.com/islishude/blog/issues/244)
