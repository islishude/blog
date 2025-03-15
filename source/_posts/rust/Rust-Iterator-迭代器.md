---
title: Rust Iterator 迭代器
categories:
  - rust
date: 2020-09-21 22:35:00
tags:
---

在 Rust 中很多常用数据结构，例如Vector、HashMap 都内置了迭代器，消费这些结构直接只使用 `for...in` 的结构即可。

```rust
let v = vec![1, 2, 3];
for i in v {
    println!("{}", i);
}
```

如果要自定义一个迭代器，只要实现 Iterator trait 即可，每次遍历都是运行 next 方法，直到返回 None。

```rust
pub struct Counter {
    pub count: usize,
}

impl Iterator for Counter {
    type Item = usize;
    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count < 6 {
            Some(self.count)
        } else {
            None
        }
    }
}
```

如下所示，可以直接使用 for 进行遍历。

```rust
fn main() {
    let c = Counter { count: 0 };
    for i in c {
        println!("{}", i);
    }
}
```

不过你可能会发现，这里的变量 c 是不可变的，但是我们定义的 Iterator.next 需要是可变的。

但是这个编译器没有报错，可以正常运行，那这怎么回事？

事实上 `for...in` 只是一个语法糖，上面的代码转化为运行的代码是下面这个：

```rust
fn main() {
    let c = Counter { count: 0 };
    match IntoIterator::into_iter(c) {
        mut iter => loop {
            let next;
            match iter.next() {
                Some(val) => next = val,
                None => break,
            };
            let x = next;
            let () = {
                println!("{}", x);
            };
        },
    };
}
```

这里 c 转化成 `iterator::IntoIterator` 并调用 `into_iter()` 方法，由于 Counter 没有实现 Copy trait，c 也会移动到 iter 可变变量上，所以这里就可以修改内部变量。

内部会不断循环调用，知道 next 方法返回 None。

所以 `for...in` 在类型没有实现 Copy 的时候会移动变量，后续也不能再使用这个变量。

```rust
fn main() {
    let c = Counter { count: 0 };
    for i in c {
        println!("{}", i);
    }
    println!("{}", c.count); // Error
    // borrow of moved value: `c`
    // value borrowed here after moverustc(E0382)
    // main.rs(19, 14): value moved here
    // main.rs(18, 9): move occurs because `c` has type `Counter`, which does not implement the `Copy` trait
    // main.rs(19, 14): consider borrowing to avoid moving into the for loop
}
```

如果我们为 Counter 加上 Copy 和 Clone trait，那么这里就不会报错了，但是由于 for 循环仅仅复制了 c 数据，所以最后还是打印值为 0

```rust
#[derive(Copy, Clone)]
pub struct Counter {
    pub count: usize,
}

fn main() {
    let c = Counter { count: 0 };
    for i in c {
        println!("{}", i);
    }
    println!("{}", c.count); // 打印为 0
}
```

Iterator 内置了很多高阶函数, 类如 map/reduce 也都支持。

```rust
pub fn main() {
    let a = vec![1, 2, 3, 4, 5];
    let b: Vec<i32> = a.iter().map(|&x| x * 2).collect();
    assert_eq!(b, vec![2, 4, 6, 8, 10]);
}
```

这里需要两点，一是迭代器是惰性的，链式调用的最后需要使用 `collect()` 进行收集；二是消费迭代器不能自动类型推导，需要手动定义类型，这里给变量定义类型或使用 turbofish，另外这个类型需要满足 `FromIterator<T>`，一般而言用 `Vec<T>` 即可。

```rust
pub fn main() {
    let a = [1, 2, 3];
    let _ = a.iter().map(|&x| x * 2).collect::<Vec<i32>>();
    let _: Vec<i32> = a.iter().map(|&x| x * 2).collect();
}
```

对于 reduce 方法，在 rust 中名称为 `fn fold<B, F>(self, init: B, f: F) -> B`。

比如计算从 1 到 3 的和，初始值为 1。

```rust
pub fn main() {
    let a = [1, 2, 3];
    let sum = a.iter().fold(1, |acc, x| acc + x);
    assert_eq!(sum, 7);
}
```

如果是计算和的话，还有更简单的方法，使用内置的 sum 方法：

```rust
pub fn main() {
    let a = [1, 1, 2, 3];
    let sum: i32 = a.iter().sum();
    assert_eq!(sum, 7);
}
```

也有计算阶乘的内置方法 `product()`

```rust
fn factorial(n: u32) -> u32 {
    (1..=n).product()
}
assert_eq!(factorial(0), 1);
assert_eq!(factorial(1), 1);
assert_eq!(factorial(5), 120);
```
