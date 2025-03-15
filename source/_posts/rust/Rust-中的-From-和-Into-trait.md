---
title: Rust 中的 From 和 Into trait
categories:
  - rust
date: 2020-09-21 22:34:08
tags:
---

Rust 中 From trait 定义一个类型如何转换为另一个类型的过程，还有些类似于构造函数。比如最常见的可以将 str 转换为 String

```rust
let my_str = "hello";
let my_string = String::from(my_str);
```

再比如将一个原始 i32 数字转化为 Number 类型

```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let num = Number::from(30);
    println!("My number is {:?}", num);
}
```


如果一个类型实现了 From，那么也自动实现了 Into trait，Into 实际上是 From 的逆运算。由于类型可能有多个 From 实现，那么需要具体声明返回值类型。


```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let int = 5;
    let num: Number = int.into();
    println!("My number is {:?}", num);
}
```


在密码学库中，也可以定义私钥到公钥的转换。如下所示，ed25519 的私钥生成中，从私钥获取公钥的过程直接由 `let pk: PublicKey = (&sk).into();` 一步完成。

具体实现则由 From trait 实现，这样让代码逻辑中的转换实现流程更清晰了。

```rust
/// An ed25519 keypair.
#[derive(Debug, Default)] // we derive Default in order to use the clear() method in Drop
pub struct Keypair {
    /// The secret half of this keypair.
    pub secret: SecretKey,
    /// The public half of this keypair.
    pub public: PublicKey,
}
impl KeyPair {
    pub fn generate<R>(csprng: &mut R) -> Keypair
    where
        R: CryptoRng + RngCore,
    {
        let sk: SecretKey = SecretKey::generate(csprng);
        let pk: PublicKey = (&sk).into();

        Keypair{ public: pk, secret: sk }
    }
}

/// An EdDSA secret key.
#[derive(Default)] // we derive Default in order to use the clear() method in Drop
pub struct SecretKey(pub(crate) [u8; SECRET_KEY_LENGTH]);

impl AsRef<[u8]> for SecretKey {
    fn as_ref(&self) -> &[u8] {
        self.as_bytes()
    }
}

/// An ed25519 public key.
#[derive(Copy, Clone, Default, Eq, PartialEq)]
pub struct PublicKey(pub(crate) CompressedEdwardsY, pub(crate) EdwardsPoint);

impl<'a> From<&'a SecretKey> for PublicKey {
    /// Derive this public key from its corresponding `SecretKey`.
    fn from(secret_key: &SecretKey) -> PublicKey {
        let mut h: Sha512 = Sha512::new();
        let mut hash: [u8; 64] = [0u8; 64];
        let mut digest: [u8; 32] = [0u8; 32];

        h.input(secret_key.as_bytes());
        hash.copy_from_slice(h.result().as_slice());

        digest.copy_from_slice(&hash[..32]);

        PublicKey::mangle_scalar_bits_and_multiply_by_basepoint_to_produce_public_key(&mut digest)
    }
}
```


代码引用地址：

1. https://doc.rust-lang.org/rust-by-example/conversion/from_into.html
2. https://github.com/dalek-cryptography/ed25519-dalek/blob/master/src/secret.rs