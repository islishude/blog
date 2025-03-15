---
title: JS中非严格比较操作符的类型转换逻辑
categories:
  - Node.js
date: 2019-01-30 11:01:34
tags:
---

在 JavaScript 中有六种数据会自动转化为布尔型

```js
if ( !undefined
  && !null
  && !0
  && !NaN
  && !''
) {
  console.log('bool true');
} // bool true
```

在ECMA规范中非严格操作符（`==`）是会强制类型转换的，这点和上面的六种转换逻辑还不一样，也就是说当遇到非严格操作符的时候，`undefined`不会转化为`false`然后再与后面对比。

```js
console.log( undefined == false) // false
```
规范有点绕，其实特别简单——

如果要比较 `x==y`，有下面这几种情况

> 如果 x 和 y 的类型相同，那就直接比较值，这个相当于转化为严格等于

```js
console.log( 1 == 2) //false
```
> 如果 x 和 y 要么是 null 要么是 undefined，则返回 true

```js
console.log( undefined == null ) //true
```
> 如果 x 和 y 一个是 string 类型，一个是 number 类型，那么 string 类型的要转化为 number 类型。

```js
console.log( '1' == 1, '1a' == 1)  //true false 
```
> 如果 x 和 y 其中一个是 bool 值，那么这个 bool 值要转化为 number 类型

```js
console.log(1 == true, 0 == false) // true true
```
>  如果 x 和 y 其中一个是 Object，那么 Object 要转化为原始类型。

```js
console.log(['1'] == 1)//true
```

不属于以上情况，返回 `false`。

那么问题来了，`console.log( [] == false )`的结果是什么？

正确答案为 `true`，但是 `console.log( !![] == true)` 也是返回 `true`，因为按照优先级，这个是需要先执行 `!![]`，也就是是` !!(ToBoolean([]))`

更有趣的一点，你可以在浏览器中运行

```js
console.log(Array.isArray(Array.prototype))
```

上面的转化逻辑是ECMA的标准的，其实更简单的理解就是:

**如果都是原始类型，那么都转化为数值类型；如果是对象，那么就转化为原始类型再进行比较。undefined和null与其他类型的值比较时，结果都为false，它们互相比较时结果为true。**