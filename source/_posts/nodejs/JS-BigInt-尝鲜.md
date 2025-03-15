---
title: JS BigInt 尝鲜
tags:
  - BigInt
categories:
  - Node.js
date: 2018-05-19 22:20:54
---

JavaScript 所有数字内部都是 float64 类型，所以数值的精度最多只能到 53 个二进制位，大于这个范围的整数是无法精确表示的。

```js
2 ** 53;
// 9007199254740992
2 ** 53 + 1;
// 9007199254740992
```

在很多金融场景如果使用 JS 的话就得使用一些 BigNumber 库。其中以太坊 web3.js 使用的是最为流行的是 [bignumber.js](https://github.com/MikeMcl/bignumber.js)，并且包含 `.d.ts` 类型提示，推荐在生产环境使用。

因为这些库表示大数的方式是以 16 进制字符串表示的，通常在实践中还需要使用 `Buffer.from()` 转换成二进制对象，还是有很多不方便，需要写很多辅助函数。不过以后我们就可以使用官方标准库中的 BigInt 了。

目前（2018 年 5 月 1 日）BigInt 提案已经进入 TC39 stage 3，不过还是被 V8 引擎提前实现，本文所有代码示例基于 Chrome Canary 68.0.3415.0，如下图所示。

```js
typeof 123;
// "bigint"
2n ** 53n;
// 9007199254740992n
2n ** 53n + 1n;
// 9007199254740993n
```

BigInt 表示没有精度和大小限制的整数，为了兼容性考虑，在数字后面添加后缀`n` 和普通数字类型区分，使用二进制八进制和十六进制也可以表示。

```js
123n;
// 123n;
0b101n;
// 5n;
0o123n;
// 83n;
0xabcn;
// 2748n;
```

数字的字符串形式可以类似于 `Number()` 使用 `BigInt()` 直接转换为 BigInt，需要注意的是参数检查和 Number() 是一致的，是不能使用 `123n` 字符串形式的参数。

```js
123n;
//123n
0b101n;
// 5n
0o123n;
//83n
0xabcn;
//2748n

BigInt("123");
// 123n
BigInt("0xa");
// 10n
BigInt("0b1");
// 1n
BigInt("0o1");
// 1n

new BigInt();
// Thrown:
// TypeError: BigInt is not a constructor
//     at new BigInt (<anonymous>)
BigInt(undefined);
// Thrown:
// TypeError: Cannot convert undefined to a BigInt
//     at BigInt (<anonymous>)
BigInt(null);
// Thrown:
// TypeError: Cannot convert null to a BigInt
//     at BigInt (<anonymous>)
```

BitInt 除了不能和 number 类型直接运算之外，其它方面和普通的数值运算没有多少区别，除法运算始终返回整数形式。

```js
5n / 2n;
// 2n
5n + 2;
// Thrown:
// TypeError: Cannot mix BigInt and other types, use explicit conversions
```

BigInt 也存在隐式转换，在相等运算符`==`、不同类型运算以及强制类型转化函数，都还存在 JS 远古传统。

```js
2n == 2;
// true
2n === 2;
// false
0n == "";
// true
0n == 0;
// true
0n == false;
// true
"" + 123n;
// '123'
```

更多内容可以参考 [BigInt 提案](https://github.com/tc39/proposal-bigint)
