---
layout: blockchain
title: BitcoinCore 安装清单
categories:
  - blockchain
date: 2018-07-31 17:53:57
tags:
---

```
sudo apt install software-properties-common
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt update
sudo apt install -y bitcoind
# 运行
bitcoind -daemon
# 查看信息
bitcoin-cli getblockchaininfo
```
