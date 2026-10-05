---
title: "ECMAScript2021: 逻辑赋值运算符"
date: 2020-10-08 03:10:07
slug: "nodejs/ECMAScript2021-逻辑赋值运算符"
categories: ["Node.js"]
tags: ["Web"]
---

目前 js 支持 3 种逻辑赋值运算符：

```js
// Logical OR assignment
a ||= b; // 等价于 a || (a = b);

// Logical AND assignment 
a &&= b; // 等价于 a && (a = b);

// Logical nullish assignment
a ??= b; // 等价于 a ?? (a = b);
```

与数学意义的逻辑运算符不同的是，逻辑赋值符在不符合逻辑条件下不会触发 setter

```js
const obj = {
  _x: 0,
  get x() {
    return this._x;
  },
  
  set x(value) {
    console.log('setter called');
    this._x = value;
  }
};

// 始终会打印 "setter called"
obj.x += 1;
assert.equal(obj.x, 1);

// 当不满足逻辑条件调用时不会触发 setter
// 所以这里不会打印
obj.x ||= 2;
assert.equal(obj.x, 1);

// 但当满足逻辑条件时就会触发 setter
// 所以这里会打印 "setter called"
obj.x &&= 3;
assert.equal(obj.x, 3);
```

实际使用中，逻辑赋值运算符能提供更好的性能，如下面代码：

```js
// Display a default message if it doesn’t override anything.
// Only assigns to innerHTML if it’s empty. Doesn’t cause inner
// elements of msgElement to lose focus.
function setDefaultMessage() {
  msgElement.innerHTML ||= '<p>No messages<p>';
}

// Display a default message if it doesn’t override anything.
// Buggy! May cause inner elements of msgElement to
// lose focus every time it’s called.
function setDefaultMessageBuggy() {
  msgElement.innerHTML = msgElement.innerHTML || '<p>No messages<p>';
}
```

上述代码中赋值给 `.innerHTML` 属性会删除 `msgElement` 元素内部子元素，然后插入从新分配的字符串后再进行解析，而逻辑赋值运算符正好能解决这种不必要的副作用。

目前 chrome 86 已经支持，~~但最新版 node v14.13.1 还未支持~~ nodejs [v15.0.0](https://github.com/nodejs/node/releases/tag/v15.0.0)开始支持。

---

原文：[GitHub Issue #241](https://github.com/islishude/blog/issues/241)
