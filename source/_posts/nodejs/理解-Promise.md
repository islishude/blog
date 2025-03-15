---
title: 理解 Promise
categories:
  - Node.js
date: 2019-01-30 11:23:03
tags:
---

## 语法
```
new Promise(
    /* executor */
    function(resolve, reject) {...}
);
```
### 参数
executor是一个带有resolve和reject两个参数的函数 **。executor 函数在Promise构造函数执行时同步执行**，被传递resolve和reject函数（executor 函数在Promise构造函数返回新建对象前被调用）。resolve 和 reject 函数被调用时，分别将promise的状态改为fulfilled(完成)或rejected（失败）。executor 内部通常会执行一些异步操作，一旦完成，可以调用resolve函数来将promise状态改成fulfilled，或者在发生错误时将它的状态改为rejected。如果在executor函数中抛出一个错误，那么该promise 状态为rejected。executor函数的返回值被忽略。

Promise 对象是一个代理对象（代理一个值），被代理的值在Promise对象创建时可能是未知的。它允许你为异步操作的成功和失败分别绑定相应的处理方法（handlers ）。 这让异步方法可以像同步方法那样返回值，但并不是立即返回最终执行结果，而是一个能代表未来出现的结果的promise对象

一个 Promise有以下几种状态:

- pending: 初始状态，不是成功或失败状态。
- fulfilled: 意味着操作成功完成。
- rejected: 意味着操作失败。

pending 状态的 Promise 对象可能触发fulfilled 状态并传递一个值给相应的状态处理方法，也可能触发失败状态（rejected）并传递失败信息。当其中任一种情况出现时，Promise 对象的 then 方法绑定的处理方法（handlers ）就会被调用（then方法包含两个参数：onfulfilled 和 onrejected，它们都是 Function 类型。当Promise状态为fulfilled时，调用 then 的 onfulfilled 方法，当Promise状态为rejected时，调用 then 的 onrejected 方法， 所以在异步操作的完成和绑定处理方法之间不存在竞争）。

因为 Promise.prototype.then 和 Promise.prototype.catch 方法返回promise 对象， 所以它们可以被链式调用。

Promise.then()会始终接收上一层Promise的返回值，使用 `resolve(value)` 或者 `return value` ，注意：在JS中无返回值的函数是返回的`underfined`

```js

// 有返回值，并且为1
function func1(){
    return 1;
}

// 无返回值
function func2(){
   console.log(2)
}

//无返回值
function func3(){
   func1();
}
```
Promise.then()，接收一个参数，如果参数为函数才会**上一个**then与异步（即等待上一个Promise执行结束后再执行），如果参数返回的是Promise对象才会**下一个t**hen异步进行（即当前执行结束后才会执行下一个then）。

在这些例子中，我假定 doSomething() 和 doSomethingElse() 均返回 promises，并且这些 promises 代表某些在 JavaScript event loop (如 IndexedDB, network, setTimeout) 之外的某些工作结束，这也是为何它们在某些时候表现起来像是并行执行的意义。这里是一个模拟用的 [JSBin](http://jsbin.com/tuqukakawo/1/edit?js,console,output)。

```js
doSomething().then(function () {
  return doSomethingElse();
}).then(finalHandler);
```

**Answer:**

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```

**Puzzle2**

```js
doSomething().then(function () {
  doSomethingElse();
}).then(finalHandler);
```

**Answer:**

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                  finalHandler(undefined)
                  |------------------|
```
**Puzzle3**

```js
doSomething().then(doSomethingElse())
  .then(finalHandler);
```

**Answer:**

```
doSomething
|-----------------|
doSomethingElse(undefined)
|---------------------------------|
                  finalHandler(resultOfDoSomething)
                  |------------------|
```

**Puzzle4**

```js
doSomething().then(doSomethingElse)
  .then(finalHandler);
```
Answer:

```
doSomething
|-----------------|
                  doSomethingElse(resultOfDoSomething)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```

- [MND-Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [[翻译] We have a problem with promises](http://fex.baidu.com/blog/2015/07/we-have-a-problem-with-promises/)
- [阮一峰ES6入门指南·Promise对象](http://es6.ruanyifeng.com/#docs/promise)


补充：看其它的文章，不如看看规范，而且不长，https://promisesaplus.com/
