---
title: "比特币替换交易（RBF）"
date: 2020-10-07 08:14:19
slug: "blockchain/比特币替换交易RBF"
categories: ["Blockchain"]
tags: ["Blockchain"]
---

RBF(replace-by-fee) 在 [bip125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki) 中规范。

最简单的方式是只要存在 TxIn 成员中的 nSequence 字段值小于 0xffffffff - 1 那么就可以进行替换交易。

使用下面代码在 regtest 下进行尝试：

```go
package main

import (
	"bytes"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcec"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
	"github.com/btcsuite/btcutil"
)

func main() {
	rawpvkey, _ := hex.DecodeString("190ac32f03e9eb4c312c673ff7426f43267405bb2394b8dca32a4efe00c19209")
	prvkey, pubkey := btcec.PrivKeyFromBytes(btcec.S256(), rawpvkey)

	newtx := wire.NewMsgTx(1)
	{
		ref, _ := chainhash.NewHashFromStr("b6598fc80a3ab9cf246d9ae193280670b4cb8afa2e58a93ca2855840b8bae0c4")
		txin := wire.NewTxIn(wire.NewOutPoint(ref, 1), nil, nil)
		txin.Sequence = wire.MaxTxInSequenceNum - 2 // 这里设置RBF
		newtx.AddTxIn(txin)
	}

	raw, _ := btcutil.NewAddressPubKey(pubkey.SerializeCompressed(), &chaincfg.RegressionNetParams)
	f := raw.AddressPubKeyHash()
	subscript, _ := txscript.PayToAddrScript(f)


	{
		txout := wire.NewTxOut(999900000, subscript)
		newtx.AddTxOut(txout)
	}

	{
		sig, _ := txscript.SignatureScript(newtx, 0, subscript, txscript.SigHashAll, prvkey, true)
		newtx.TxIn[0].SignatureScript = sig
	}

	buf := bytes.NewBuffer(nil)
	if err := newtx.Serialize(buf); err != nil {
		panic(err)
	}
	fmt.Println(hex.EncodeToString(buf.Bytes()))
}
```

然后进行发送，可以看到内存池中已经有这个交易了。

```console
$ bitcoin-cli sendrawtransaction 0100000001c4e0bab8405885a23ca9582efa8acbb470062893e19a6d24cfb93a0ac88f59b6010000006b483045022100989f9c87d8673d3b69006cd21bb8d4fbd38656b9f7da942f655045bec5dfc94f022011b1768fa649f9f408fa57f91eb20bf7adc3eea114fdae575cc28dea36439dd901210309ef4856e749d2a1ce637467fa889215cea0edf6110d137f6b6eec05858d9a78fdffffff016043993b000000001976a914573a0b5303f329be316ed154b4488c2c4534198488ac00000000
bbf976adbfca2242c92a38efad780187222b700c3fc20a1b93e4e428e3e19a03
$ bitcoin-cli getrawmempool
[
  "bbf976adbfca2242c92a38efad780187222b700c3fc20a1b93e4e428e3e19a03"
]
```

然后更改下矿工费，也就是减少输出的值即可：

```go
// 999900000 => 999800000
txout := wire.NewTxOut(999800000, subscript)
newtx.AddTxOut(txout)
```

继续尝试发送：

```console
$ bitcoin-cli sendrawtransaction 0100000001c4e0bab8405885a23ca9582efa8acbb470062893e19a6d24cfb93a0ac88f59b6010000006a47304402203ffdebc575d7da354f6b1dc5c80df0c4efdd4dbf31870b4cb4720e1974fd0d1f022058fcc6e8e6ab000974d115adb64b62c1522db00c301e131bab8a96a9baca71b601210309ef4856e749d2a1ce637467fa889215cea0edf6110d137f6b6eec05858d9a78fdffffff01c0bc973b000000001976a914573a0b5303f329be316ed154b4488c2c4534198488ac00000000
615217ca87cff16686f77575afdcc3d67f42bda0f5b995a612a2280581a86f8a
$ bitcoin-cli getrawmempool
[
  "615217ca87cff16686f77575afdcc3d67f42bda0f5b995a612a2280581a86f8a"
]
```

可以看到内存池仅有一个交易，而不是两个，最后手动挖矿包含这笔交易即可。

```
$ bitcoin-cli generatetoaddress 1 bcrt1qlkuntnheuljc78lhptdnxq8zp9h93sud08sp57
[
  "42c15c8798ae000635e44585ee1999199afc9e0a49f5981d1902711fd08291f7"
]
$ bitcoin-cli getblock 42c15c8798ae000635e44585ee1999199afc9e0a49f5981d1902711fd08291f7 true
{
  "hash": "42c15c8798ae000635e44585ee1999199afc9e0a49f5981d1902711fd08291f7",
  "confirmations": 1,
  "strippedsize": 406,
  "size": 442,
  "weight": 1660,
  "height": 204,
  "version": 805306368,
  "versionHex": "30000000",
  "merkleroot": "b7bf8e6bd8fc4de9045cb72ca7c9fc1754e5bdaf46918f4fafc27038daf1e0f5",
  "tx": [
    "6b1a16c58c0adf2f1a26599b0b68d8f248d7a582701cf5757d9c5121fc696f97",
    "615217ca87cff16686f77575afdcc3d67f42bda0f5b995a612a2280581a86f8a"
  ],
  "time": 1602058070,
  "mediantime": 1602056335,
  "nonce": 0,
  "bits": "207fffff",
  "difficulty": 4.656542373906925e-10,
  "chainwork": "000000000000000000000000000000000000000000000000000000000000019a",
  "nTx": 2,
  "previousblockhash": "4b0f2923c0f1b8e92c7db4e7ac0d2dcf3df27406af781362ebd5f26083452be9"
}
```

---

原文：[GitHub Issue #240](https://github.com/islishude/blog/issues/240)
