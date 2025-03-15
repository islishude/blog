---
title: for(const num of list) 为什么可以运行？
categories:
  - Node.js
date: 2019-01-30 11:41:34
tags:
---

JS 在 ES6 加入了 const 关键字，除了加入了其它语言一样的常量特性，不仅没有 var 的变量提升，还有块级作用域特性。

常量是不可变的，在 ES6 中指的是常量存储地址的不变性，而不是常量的不可变。所以在 `const arr = [];arr.push(1)` 是可以运行的。

了解这个之后，我们再看看 for 循环

```js
for (const i = 0; i < 5; i++) {
    console.log(i)
}
```

那么这个就是**错的**，如果我们用 C++ 改写，并且输出的是循环量的地址的话，那么就可以看出，for 循环每次循环都是相同的地址。

```c++
int main() {
    for (int i = 0; i < 3; i++) {
        cout << &i << endl;
    }
    return 0;
}
// 都是输出一样的
```

根据 const 是不可修改原地址值得特性，所以说 const 用在 for 循环中是错误的。不过下面使用 `for...of` 就是对的。

```js
const list = [1, 2, 3, 4, 5]

for (const num of list) {
    console.log(num)
}
```

根据上述说明，可以推断出 `for...of` 每次循环都是产生一个新的地址，并把新的值指向这个地址。那么 `for...of` 使用 const 有什么作用？

```js
// 例子来源于 MDN
let iterable = [10, 20, 30];

for (let value of iterable) {
    // 修改了值
    value += 1;
    console.log(value);
}
```

也就是说如果使用了 const 在此块级作用域下是不可以修改的。

不过在 Go 中是复用相同地址的变量，不能设置 const 的常量的形式，所以就是相同的地址了。

```go
package main

import (
	"fmt"
)

func main() {
	s := []int{1, 2, 3, 4}

	for _, v := range s {
		fmt.Println(&v)
	}
	// 0xc4200160a0
	// 0xc4200160a0
	// 0xc4200160a0
	// 0xc4200160a0
}
```