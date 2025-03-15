---
title: age：一个现代化的加密工具
categories:
  - crypto
date: 2020-09-21 22:28:45
tags:
---

age：一个现代化的加密工具

[age](https://github.com/FiloSottile/age) 是 golang crypto 库的维护者之一的 [FiloSottile](https://twitter.com/FiloSottile) 写的一个现代化加密工具，目前正处在 Beta 阶段。

age 的是 Actual Good Encryption 的缩写，有点 PGP(Pretty Good Privacy) 的意思，说起来作者本身的想法就是[想替代GnuPG](https://twitter.com/filosottile/status/1127643698676797441)。

age 的现代化体现在密码学算法的选择上，age 使用 x25519 作为非对称加密算法，x25519 是 Curve25519 被设计用于密钥交换的曲线，是目前公认的最快的椭圆密码曲线，它还有个用做签名的 ed25519 的兄弟，二者的公私钥可以[互相转换](https://libsodium.gitbook.io/doc/advanced/ed25519-curve25519)。

对称加密算法选择上，age 使用 chacha20poly1305 ，现在已经是 TLS1.3 推荐对称加密算法，这个密码套件由两个算法构成：ChaCha20，一种流式密码，提供并行处理能力；以及用作认证加密(AEAD)的Poly1305。

age 的密钥也就是 x25519 的密钥，密钥的格式使用比特币[bech32](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki)方式存储，bech32 相比 base58 编码提供更小的空间占用和更快的校验方式。

```go
import "filippo.io/age/internal/bech32"

// 在 age 中私钥的别称是 Identity
type X25519Identity struct {
	secretKey, ourPublicKey []byte
}

func (i *X25519Identity) String() string {
	s, _ := bech32.Encode("AGE-SECRET-KEY-", i.secretKey)
	return strings.ToUpper(s)
}

func (i *X25519Identity) Recipient() *X25519Recipient {
	r := &X25519Recipient{}
	r.theirPublicKey = i.ourPublicKey
	return r
}

// 在 age 中公钥的别称是 Recipient
type X25519Recipient struct {
	theirPublicKey []byte
}

func (r *X25519Recipient) String() string {
	s, _ := bech32.Encode("age", r.theirPublicKey)
	return s
}
```

在命令行下只需要运行 `age-keygen` 即可生成一个新公私钥对：

```console
$ age-keygen
# created: 2020-01-11T22:53:47+08:00
# public key: age1sr534qzh3q408qmzkeamu7qux3l544fwwyluneks9f2ljjvdgpqqcfrgny
AGE-SECRET-KEY-1LTU2MHXLUJZDVANL949U694MH5PJ909KSQERSDE2TP3GTSRZSGYSNV3Y5N
```

在 x25519 下为了加密通常需要使用 ECDH，使用己方私钥和对方公钥计算出共享密钥，然后使用共享密钥密码进行加密。不过如果己方长期使用的私钥泄露，那么所有的历史消息都是有可能被破解的。为了保证前向安全，加密密钥，在 age 中称之为 fileKey，需要是临时生成的，只用做一次性加密。为了共享这个 filekey，可以使用 ECDH 共享密钥加密 filekey，那么接收方也能计算出共享密钥来得到真正加密密钥。加密 filekey 的这个操作称之为 Wrap，所以加密 fileKey 的加密密钥也称之为 wrappingKey。

```go
// internal/age/x25519.go

// 己方密钥不参与加密流程
// 那么这里用作 ECDH 的 x25519 key 也需要是临时生成的

// 生成一对 x25519 临时私钥
ephemeral := make([]byte, curve25519.ScalarSize)
if _, err := rand.Read(ephemeral); err != nil {
	return nil, err
}

// 根据私钥计算临时公钥
ourPublicKey, err := curve25519.X25519(ephemeral, curve25519.Basepoint)
if err != nil {
	return nil, err
}

// 计算 ECDH 共享密钥
var r *X25519Recipient
sharedSecret, err := curve25519.X25519(ephemeral, r.theirPublicKey)
if err != nil {
	return nil, err
}
```

临时公钥会放入加密内容中，这样接收方也能使用自己的私钥计算出真正的 wrappingKey。为了保证 wrappingKey 的随机性，这里的共享密钥不是 wrappingKey，需要做一次 HKDF 后得到。

```go
// internal/age/x25519.go

const x25519Label = "age-encryption.org/v1/X25519"

salt := make([]byte, 0, len(ourPublicKey)+len(r.theirPublicKey))
// 使用我方临时公钥和对方公钥作为 HKDF 盐
salt = append(salt, ourPublicKey...)
salt = append(salt, r.theirPublicKey...)
// 使用 ECDH 公钥密钥 secret 材料生成最终的 filekey 加密密钥 wrappingKey
h := hkdf.New(sha256.New, sharedSecret, salt, []byte(x25519Label))
wrappingKey := make([]byte, chacha20poly1305.KeySize)
if _, err := io.ReadFull(h, wrappingKey); err != nil {
	return nil, err
}
```

经过上述一系列的操作我们得到 wrappingKey，之后就可以对 fileKey 进行加密。aeadEncrypt 是加密 filekey 的方法，其中 nonce 选择固定的全零值，这里由于只是加密 fileKey，作者说为了不要过度设计，如果 nonce 是随机的，那么还需要另外途径放在加密内容内。加密后的 fileKey 我们称之为 wrappedKey。

```go
// internal/age/primitives.go
func aeadEncrypt(key, plaintext []byte) ([]byte, error) {
	aead, err := chacha20poly1305.New(key)
	if err != nil {
		return nil, err
	}
	// The nonce is fixed because this function is only used in places where the
	// spec guarantees each key is only used once (by deriving it from values
	// that include fresh randomness), allowing us to save the overhead.
	// For the code that encrypts the actual payload, look at the
	// filippo.io/age/internal/stream package.
	nonce := make([]byte, chacha20poly1305.NonceSize)
	return aead.Seal(nil, nonce, plaintext, nil), nil
}
```

为了保证消息完整性，还需要填充消息验证码。age 设计了一个类型 HTTP 的协议格式，先 header 后 body ，MAC 就放在 header 中。

header 第一行为版本信息，现在固定为 `age-encryption.org/v1`；

接下来是临时公钥信息，使用 `->` 开头字符串来标志，然后紧接着一个空格加上 Type 和 Args，对于 x25519 方式加密而言，Type 是 `X25519`，Args 是不带填充的 base64 编码的公钥信息，除了 x25519 ，age 还支持 RSA，scrypt，ed25519（间接转换为x25519）等加密方式。

接下来是 wrappedKey ，也是进行 base64 进行编码，如果过长会进行换行。

header 的最后是 footer，由 `---` 开头，至此是所有计算 HMAC 的内容，计算 MAC 后放入后面。如下所示：

```
age-encryption.org/v1
-> X25519 7hjWVZhiYlh0vvIOt+gvV4WDI2yLWsr+JOIoPBSSfVA
bxtayTNuMQ+gdYgO7MaebFFTVj/SAwxWVNSCabITY64
-> X25519 BQ/dREFj+hbGVyxzSReDqtn15yVvAu5zqDyGa9cQxko
MLWTEcNlj7LThMSZK4P4bkoWakUYjiOK7rYQ3Z6gUTw
--- GGPEM7/pB9b3FpzJiym0t3wCnC7cQw/LgVjeilNkKl8
```

计算 MAC 是通过 HMAC-With-SHA256 进行，不对 body 进行 MAC 是因为我们使用 AEAD 加密内容，不需要额外的操作。

```go
func headerMAC(fileKey []byte, hdr *format.Header) ([]byte, error) {
	// 通过 filekey 计算 mac key
	h := hkdf.New(sha256.New, fileKey, nil, []byte("header"))
	hmacKey := make([]byte, 32)
	if _, err := io.ReadFull(h, hmacKey); err != nil {
		return nil, err
	}
	hh := hmac.New(sha256.New, hmacKey)
	// 下面这个过程是计算 header 的过程，内容参考上述 header 结构
	if err := hdr.MarshalWithoutMAC(hh); err != nil {
		return nil, err
	}
	return hh.Sum(nil), nil
}
```

body 是存放加密内容的地方。这里计算方式是 chacha20poly1305 的过程，为了得到最终的加密密钥，这里生成了同样 16 字节的 nonce，与 fileKey 进行 HKDF 混合后得到。

```go
func streamKey(fileKey, nonce []byte) []byte {
	h := hkdf.New(sha256.New, fileKey, nonce, []byte("payload"))
	streamKey := make([]byte, chacha20poly1305.KeySize)
	if _, err := io.ReadFull(h, streamKey); err != nil {
		panic("age: internal error: failed to read from HKDF: " + err.Error())
	}
	return streamKey
}
```

body 先写入 nonce 后，后续使用流式方式加密并写入。

这个就是 age x25519 的加密方式的所有内容，解密最重要的计算 filekey 的过程，这个上述有说过，这里不再赘述。(TODO：或许以后会写)

命令行工具进行加解密也十分简单：

```console
$ head -c 32 /dev/urandom | base64 > plain.txt # 生成一个文本并保存到 plain.txt
$ age -r [RECIPIENT PUBKEY] -o cipher.txt plain.txt # 加密 plain.txt 文件并保存到 cipher.txt
$ age -i [IDENTITY PRVKEY] -o decrypt.txt -d cipher.txt # 解密 cipher.txt 并保存到 decrypt.txt
```

age 加密也支持读取 stdin 数据：

```console
$ tar cvz ~/data | age -r age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p > data.tar.gz.age
```

也可以制定 -a 参数加密为 base64 格式数据：

```console
$ age -r [RECIPIENT PUBKEY] -a -o cipher.txt plain.txt
```

如果要输出到 stdout 需要指定 `-` 

```console
$ age -r [RECIPIENT PUBKEY] -a -o - plain.txt
```

总之 age 是个非常简单而且现代化的加密工具，但很遗憾的是，age只提供加解密，并不提供签名功能，加密流程也没有提供签名，只能可以在确认发送方身份时使用。

### 备注

#### Why HKDF

HKDF 遵循“先提取后扩展”的模式，其中KDF逻辑上由两个模块组成。第一阶段采用输入密钥材料并从中“提取”固定长度的伪随机密钥K。第二阶段将密钥K“扩展”为多个附加的伪随机密钥（KDF的输出）。在许多应用中，输入密钥材料不一定均匀分布，攻击者可能对其有部分了解（例如，由密钥交换协议计算的Diffie-Hellman值），甚至对其有部分控制（如在一些熵收集应用中）。因此，“提取”阶段的目标是将输入密钥材料的可能分散的熵“集中”成一个短的、但加密性强的伪随机密钥。在某些应用中，输入可能已经是一个很好的伪随机密钥；在这些情况下，不需要“提取”阶段，“扩展”部分可以单独使用。第二阶段将伪随机密钥“扩展”到所需的长度；输出密钥的数量和长度取决于需要密钥的特定加密算法。[RFC](https://tools.ietf.org/html/rfc5869#section-1)

#### Why not RSA

RSA 仍被广泛使用，但是有个已知安全问题，[PKCS#1.5签名密钥](https://golang.google.cn/pkg/crypto/rsa/#SignPKCS1v15)也是[OAEP的加密密钥](https://golang.google.cn/pkg/crypto/rsa/#EncryptOAEP)。另外RSA的安全强度也不如椭圆曲线，3072位RSA密钥的加密强度才等同于256位的ECC密钥的水平。