---
title: 'ECMA2020: Optional Chaining & Nullish Coalescing'
categories:
  - Node.js
date: 2020-09-21 22:06:01
tags:
---

下面这个错误在 JavaScript 中最为常见

`unable to get property of undefined or null reference` 

通常为了解决这个问题，我们可以使用 `&&` 操作符来取对象属性值。

```js
var street = user.address && user.address.street;
```

不过当数据很长的时候就特别麻烦，ECMA2020 通过了一项提案Optional Chaining，用语法糖的形式解决了这个问题：

```js
var street = user?.address
```

当 user 为 null 或者 undefined 的时候直接返回，而不继续往后取值。

除了取属性外，还支持取索引、取方法、当做函数运行。

```js
a?.b                          // undefined if `a` is null/undefined, `a.b` otherwise.
a == null ? undefined : a.b

a?.[x]                        // undefined if `a` is null/undefined, `a[x]` otherwise.
a == null ? undefined : a[x]

a?.b()                        // undefined if `a` is null/undefined
a == null ? undefined : a.b() // throws a TypeError if `a.b` is not a function
                              // otherwise, evaluates to `a.b()`

a?.()                        // undefined if `a` is null/undefined
a == null ? undefined : a()  // throws a TypeError if `a` is neither null/undefined, nor a function
                             // invokes the function `a` otherwise
```

不过需要注意的是，以下场景并支持

1. 构造函数：new a?.()
2. 模板函数： a?.\`string\`
3. 属性赋值：a?.b = c
4. 可选父类: super?.(), super?.foo

目前可以在 TypeScript3.7 以及 Chrome 80 canary 中使用。

有些时候我们需要给属性赋于默认值，如下所示，height 属性的默认值为 400。

```js
const setting = {
     height: 100
}
const height = settting.height || 400
```

但是在 js 下这样做是不对的，因为如果 height 值为 0，那么也因为 0 隐式转化为布尔值是 false 而取值 400，这个不是我们想要的结果。

我们这样改：

```js
const height = setting.height == null ? 400 : setting.height
```

这样当 height 值为 undefined 或者 null 都可以得到想要的结果，这里使用 null 和 undefined 在非严格等于下互等，而不和其他值相等的特性。但是这个会被大部分 linter 报错，如果使用严格等于的话，又会特别长：

```js
const height = ( setting.height === null || setting.height === undefined) ? 400 : setting.height
```

新的提案 Nullish Coalescing 解决了个问题：

```js
const height = setting.height ?? 400
```

目前也是可在 TypeScript3.7 或 Chrome Cannay 80 中使用。

- [proposal-nullish-coalescing](https://github.com/tc39/proposal-nullish-coalescing)
- [proposal-optional-chaining](https://github.com/tc39/proposal-optional-chaining)

