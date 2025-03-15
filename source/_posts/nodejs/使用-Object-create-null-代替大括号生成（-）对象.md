---
title: '使用 Object.create(null) 代替大括号生成（{}）对象'
categories:
  - Node.js
date: 2019-01-30 11:31:01
tags:
---

传统对象写法为 `var obj = {}` 这种写法等价于 `Object.create(Object.prototype)` ，所以 `{}` 并不是真正的空对象，它还通过原型链继承了 Object 的属性方法。

这种方式不好地方是，`{}` 在某些时候会进行隐式类型转型，还有当我们使用 `for...in` 时候会遍历原形链上的属性方法，如下面的代码所示。

```js
Object.prototype.test = 'test';
var obj = {};
console.log((obj + 0).length); // 16
for (var i in obj) {
  console.log(i); // 输出 test
}
```

当对象和数值进行运算的时候会对对象进行隐式转换，`{} + 0` 就变成了  `[object Object] + 0` 所以计算结果的长度为 16。

for...in 进行遍历的时候也会遍历原型链可枚举的属性，所以当遍历的时候还需要使用 `hasOwnProperty` 进行过滤操作。

而 `Object.create(null)` 没有这样的问题，是一个没有继承 Object 原型的属性和方法的纯对象。

```js
var obj = Object.create(null)
obj + obj  // Uncaught TypeError: Cannot convert object to primitive value
obj  + 1 // Uncaught TypeError: Cannot convert object to primitive value
```

性能方面，如下图，在以前使用 `Object.create(null)` 会有性能问题（比 `{}` 慢了很多倍），而现在已经不是问题了，而且更快了。

![image](https://user-images.githubusercontent.com/24730006/33196981-6c34b7ac-d11d-11e7-8657-8de96a968e73.png)

所以推荐大家使用 Object.create(null) 代替大括号生成（{}）对象。