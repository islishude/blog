---
title: await 技巧
categories:
  - Node.js
date: 2019-01-23 10:23:19
tags:
---

## 不要在同步函数使用 await

async/await 可以接受同步函数，相当于 `await Promise.resolve` ，今天在个异步流程中发现一个同步函数使用了 await ，结果上没什么区别，但是会有性能损失。

```js
async function t1() {
  const data = [1, 2, 3];
  const res = await data.map(val => val ** 2);
  return res;
}

async function t2() {
  const data = [1, 2, 3];
  const res = data.map(val => val ** 2);
  return res;
}

console.time(1);
t1().then(res => console.log(res));
console.timeEnd(1);

console.time(2);
t2().then(res => console.log(res));
console.timeEnd(2);
```

性能对比： 

```
1: 0.121ms
2: 0.055ms
[ 1, 4, 9 ]
[ 1, 4, 9 ]
```

## 不要使用 `return await fn()`

最近评审代码发现 `return await fn()` 这样的写法。其实这样写是多于的。

```js
async function tmp0() {
  return await new Promise(res => {
    setTimeout(() => {
      console.log("tmp0");
      res(1);
    }, 1000);
  });
}

async function tmp1() {
  const tmp = await new Promise(res => {
    setTimeout(() => {
      console.log("tmp1");
      res(1);
    }, 1000);
  });
  return tmp;
}

async function tmp2() {
  return new Promise(res => {
    setTimeout(() => {
      console.log("tmp2");
      res(1);
    }, 1000);
  });
}

async function test() {
  const [v0, v1, v2] = await Promise.all([tmp0(), tmp1(), tmp2()]);
  console.log(v0, v1, v2);
}

test()
  .then(console.log)
  .catch(console.log);

```


输出

```js
tmp0
tmp1
tmp2
1 1 1
```

可以看到这里都能返回 `1`

如果这样使用在 ESLint 中会报错，[no-retrun-await](https://eslint.org/docs/rules/no-return-await). 因为这是多于的。

## 捕获 await 错误的一个巧妙方式

在 async/await 函数中通常使用 try { await ...} catch {} 的形式捕获 async 内部错误。

不过如果这个 await 后的函数**不需要中断** async 函数，可以直接在 await 后使用 catch 即可。


```js
async function test() {
  await Promise.reject(0).catch(() => console.log(1));
  return 4;
}

test()
  .then(i => console.log("test.then => %s", i))
  .catch(e => console.log("test.catch => %s", e));
```

输出：

```
1
test.then => 4
```

注意，这里仅仅是说明这个 await 函数并不需要中断整体服务的情况下才可以。

这样的写法更为简洁。
