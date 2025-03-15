---
title: 理解ES6中的字符串和数值解构赋值
categories:
  - Node.js
date: 2018-06-04 07:39:17
tags:
---

ES6 允许从数组和对象中提取值，然后对变量进行赋值，这种“模式匹配”被称为解构。

```javascript
let [a, b, c] = [2, 3, 4];

//也就是
let a = 2;
let b = 3;
let c = 4;

let { foo, bar } = { foo: "aaa", bar: "bbb" };
//let { foo: foo, bar: bar } = { foo: "aaa", bar: "bbb" };
```

当等号右边不是数组或者对象，类如字符串、数值、布尔值会被转换成了一个类似数组的对象，这些对象都有一个`length`属性，因此还可以对这个属性解构赋值。

```javascript
let {length : len} = 'he';
len // 2
```
上面的字符串`hello`会先转化为`new String('he')`包装对象，所以会有`length`、`toString`等属性或方法，所以如果要理解这个的话可以把上述转化为：

```javascript
let hello = new String('he');
let {length: len} =  {0: "h", 1: "e", length: 2,__proto__: String}
```