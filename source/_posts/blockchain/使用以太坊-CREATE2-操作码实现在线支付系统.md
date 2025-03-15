---
title: '使用以太坊 CREATE2 操作码实现在线支付系统 '
categories:
  - blockchain
date: 2020-09-21 22:20:55
tags:
---

假设我们有个一个支持 ETH 支付的线上商城，支付系统怎么设计？

因为 ETH 支持合约，我们可以设计一个单地址合约，让顾客扫描预定义的二维码，二维码含有订单id，当支付成功后发送一个 Pay 事件，订单系统只要监听这个事件即可。不过我们需要设计一整套的系统，包括二维码标准、合约系统等等，而且不能兼容交易所/钱包的转账提现操作。

```js
pragma solidity ^0.6.0;

contract Payment {
    constructor() public {}
    
    event Pay(bytes32 orderId, uint256 value );
    function pay(bytes32 orderId) public payable {
    }
}
```

为了兼容已有的转账提现操作，我们需要直接使用地址收款操作，为每一个订单提供一个地址，这个可以使用 bip32 实现，使用一个助记词生成多个 xpub 扩展公钥，然后就可以安全的生成新地址进行收款，这种方式需要集中托管商户的钱。

如果我们要支持 C2C 这种模式，而且卖家不想将钱托管在我们这里，也就是更去中心化些，基于 bip32 的方式实现并不好。那么让商家保存自己 bip32 可以吗？这个可以的，这里商家需要做的就是安全的保存好助记词。

使用 bip32 构建支付系统的很多，比如 [bitpay](https://github.com/bitpay/jsonPaymentProtocol) 的比特币在线支付协议。

除此之外，在以太坊上卖家可以类似 bip32 自己构建一个工厂合约，用于创建新的支持收款合约，买家付款后，卖家监听这个这个合约的地址余额变化。

```js
pragma solidity ^0.6.0;

contract Payment {
    address payable public dst;
    constructor(address payable _dst) public {
        dst = _dst;
    }
    
    function flush() public {
        dst.transfer(address(this).balance);
    }
    fallback() external payable {}
}

contract Factory {
    address payable public owner;
    
    constructor() public {
        owner = msg.sender;
    }
    
    function create() public returns (address){
        require(msg.sender == owner, "403");
        Payment p = new Payment(owner);
        return address(p);
    }
}
```

不过这样有个很大问题，每次付款都要生成一个新合约，卖家太浪费钱了，遇到恶意下单而不付款更损失钱。

另外还有个问题，如果买家都是善良的，不会恶意，但是创建合约账户的计算公式是 `keccak256(rlp([sender, nonce]))` ，这个和发送者及其 nonce 相关，而这里的 nonce 准确说是序列（sequence）并不是实际随机数，所以开发者并不能随意控制合约账户的生成，如果要生成第 100 个合约账户，还得需要先创建前 99 个。

CREATE2 解决了这两个问题，一方面允许开发者不依赖 nonce 的情况下控制账户的生成方式，另一方面开发者可以先使用，需要时再进行创建。

怎么做到的呢？其实很简单。账户标志符号，本质上就是 20 字节的随机数，无论从什么方式生成这 20 字节都可以作为账户使用。那么只要定义安全的账户生成方式即可。

CREATE2 定义了新的账户生成方式：`keccak256( 0xff ++ address ++ salt ++ keccak256(init_code))[12:]`。这里的 address 还是指发送者账户，可以是合约账户，也可以是外部账户；salt 是额外的数据，固定为 32 字节，开发者可以随意控制；init_code 是合约初始化代码及其参数。

CREATE2 已经在以太坊 Constantinople 分叉后上线，现在已经可以在主网和测试网上使用。

下面使用一个钱包的例子来说明，我们需要在链下进行不需要任何私钥的方式进行创建账户，然后使用这个账户进行收款，最后这些账户受一个合约来管理。

```js
pragma solidity ^0.6.2;

contract Account {
    address payable public reciever;
    event Flush(address to, uint256 value);

    constructor(address payable _reciever) public {
        reciever = _reciever;
    }

    function flush() public {
        uint256 balance = address(this).balance;
        if (balance == 0){
            return;
        }
        reciever.transfer(balance);
        emit Flush(reciever, balance);
    }
}

contract Wallet {
    address payable public admin;
    mapping(address => bool) public accounts;

    event Create(address);

    constructor() public {
        admin = msg.sender;
    }

    modifier OnlyAdmin {
        require(msg.sender == admin, "403");
        _;
    }

    // 在这里创建新的 CREATE2 账户，保证 CREATE2 的地址参数始终是当前合约
    function create(address payable _to, bytes32 _salt) public OnlyAdmin {
        Account a = new Account{salt: _salt}(_to);
        emit Create(address(a));
    }
}
```

其中 `Account a = new Account{salt: _salt}(_to);` 是 Solidity 0.6.2 加入的支持 CREATE2 的语法糖，在之前的版本需要使用内联汇编实现：

```js
function create(address payable _to, uint256 salt) public {
    bytes memory deploymentData = abi.encodePacked(
        type(Forwarder).creationCode,
        uint256(_to)
    );

    assembly {
        let a := create2(
            0x0, add(0x20, deploymentData), mload(deploymentData), salt
        )
    }
    emit Create(a);
}
```

为了链外创建 CREATE2 地址，我们首先需要创建 Wallet 合约。这里部署在以太坊上的合约地址为 `0x908e2d13714091fa97c7deb010080516817beaec`, 稍后我们将使用这个地址。

接下来我们来创建 CREATE2 地址，单独编译 `Account` 合约得到 bytecode ：

```
608060405234801561001057600080fd5b506040516101993803806101998339818101604052602081101561003357600080fd5b5051600080546001600160a01b039092166001600160a01b0319909216919091179055610134806100656000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80636b9f96ea146037578063f4b0b75614603f575b600080fd5b603d6061565b005b604560ef565b604080516001600160a01b039092168252519081900360200190f35b4780606b575060ed565b600080546040516001600160a01b039091169183156108fc02918491818181858888f1935050505015801560a3573d6000803e3d6000fd5b50600054604080516001600160a01b0390921682526020820183905280517f12b2a0ee977e74c33898f8be30fde7ae3a32ac7409a3666da55ce77e9bc32e879281900390910190a1505b565b6000546001600160a01b03168156fea26469706673582212205e6860d5d09847eb11d1dfbfc695e3cd56b77e17f59031058e0c81b5ef8043af64736f6c63430006020033
```

生成 ABI 数据：

```json
[
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_reciever",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Flush",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "flush",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reciever",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
```

然后计算 init_code 的哈希：

```go
package main

import (
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

func main() {
	// abidata 为 Account 合约 ABI json
	parsed, err := abi.JSON(strings.NewReader(abidata))
	if err != nil {
		panic(err)
	}

	// Account 合约构造函数设置了 reciever 参数
	// 为了以后能生成这个地址，这个需要持久化保存
	const reciever = "0x9639C636F1ECDA62c6c3d6eb8c1C4A630E184ff7"
	param, err := parsed.Pack("", common.HexToAddress(reciever))
	if err != nil {
		panic(err)
	}

	// 计算 Account 合约初始化哈希
	// 360c3c0304ab4f09eee311be7433387a83c3d62c7150e7654dfa339f5294eb45
	inithash := Keccak256(MustHexDecode(bytecode), param)
}
```

这里我们自定义一个 32 字节的 salt 值，这个需要持久化保存到数据库内，然后根据上面所有参数计算新的地址

```go
// Wallet 合约地址
address := MustHexDecode("0x908e2d13714091fa97c7deb010080516817beaec")
salt := MustHexDecode("0x844e2b5a3210a359906614364618e2991ecd95223bdaf2733ade658613540a9d")
inithash := MustHexDecode("360c3c0304ab4f09eee311be7433387a83c3d62c7150e7654dfa339f5294eb45")
// keccak256( 0xff ++ address ++ salt ++ keccak256(init_code))[12:]
addr := "0x" + hex.EncodeToString(Keccak256([]byte{0xff}, address, salt, inithash)[12:])
// 0x73026082ffa5b73dcbaa95626441bd9f7d4b64fd
fmt.Println(addr)
```

这个地址可以对外进行收款，如果我们想要提取地址内的钱可以取出之前持久化保存的 salt 和 reciever ，然后调用 Wallet.create ，最后调用 Account.Flush 即可将所有的钱发送到 reciever 地址内。

这种方式安全吗？除了使用 salt 这个随机参数以外，地址生成算法中的确保安全的是 init_code 的使用，我们可以确保 CREATE2 地址部署在正确的合约上。加上我们在构造函数加上了 receiver 参数，这样确保了接受者始终是我们自己，这样无论如何攻击者都无法使用任何手段获取 Account 的控制权。

上面的示例代码使用了下面辅助函数：

```go
package main

import (
	"encoding/hex"

	"golang.org/x/crypto/sha3"
)

func MustHexDecode(raw string) []byte {
        if raw == "0x" {
                return []byte{}
        }
	if len(raw) > 2 && raw[:2] == "0x" {
		raw = raw[2:]
	}
	data, err := hex.DecodeString(raw)
	if err != nil {
		panic(err)
	}
	return data
}

func Keccak256(data ...[]byte) []byte {
	d := sha3.NewLegacyKeccak256()
	for _, b := range data {
		_, _ = d.Write(b)
	}
	return d.Sum(nil)
}
```