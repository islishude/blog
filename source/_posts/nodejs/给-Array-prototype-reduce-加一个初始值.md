---
title: 给 Array.prototype.reduce() 加一个初始值
categories:
  - Node.js
date: 2019-01-30 11:16:28
tags:
---

`Array.prototype.reduce()` 方法很简单，直接加一个回调函数即可。

```js
const tmp = [0, 1, 2, 3].reduce((sum, elem) => sum + elem)
console.log(tmp)
// 输出 6
```

再进阶一点，callback 可以传入 4 个参数

- Accumulator (acc) (累计器)
- Current Value (cur) (当前值)
- Current Index (idx) (当前索引，可选)
- Source Array (src) (源数组，可选)

callback 函数的返回值分配给累计器，其值在数组的每个迭代中被记住，并最后成为最终的单个结果值。引用自 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)

当然再进阶一些，除了可以传入 callback 还可以再传入一个初始值，改一下上面的例子就是下面这样

```js
const tmp = [0, 1, 2, 3].reduce((sum, elem) => sum + elem, 100)
console.log(tmp)
// 输出 106
```
如果没有提供初始值，则将使用数组中的第一个元素。

**不过一定要注意，如果在没有初始值的空数组上调用 reduce 将报错！**

```js
[].reduce((a, b) =>　a + b)
// TypeError: Reduce of empty array with no initial value
```

这点在从客户端传入服务端的内容是需要特别注意的，反之亦然，所以最佳实践是给 `Array.prototype.reduce()` 方法第二个参数的加一个返回值类型的初始值。

```js
const BigNumber = require("bignumber.js");
// 需要返回一个 BigNumber 类型的参数
const result = [0.1, 0.2, 0.3].reduce((sum, next) => sum.plus(next), new BigNumber(0));
```
