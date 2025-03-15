---
title: 使用中转合约减少以太坊多笔转账Gas使用
categories:
  - blockchain
date: 2020-09-21 22:22:28
tags:
---

以太坊中普通交易至少需要 21000 Gas 而合约 transfer 方法仅需要 2300 Gas ，这样可以利用这点节省费用。

部署一个代理合约，使用这个代理合约进行转账，另外也不需要先转入再转出，直接使用合约进行中转

```Solidity
pragma solidity ^0.6.0;

pragma experimental ABIEncoderV2;

contract Sender {
    struct Payment {
        address payable to;
        uint256 value;
    }

    function multi(Payment[] calldata payments) external payable {
        for (uint256 i = 0; i < payments.length; ++i) {
            Payment calldata item = payments[i];
            item.to.transfer(item.value);
        }
    }
}
```

在 Goerli 网络上进行[测试](https://goerli.etherscan.io/tx/0x2d6379b9ccb49904d10164526cf4d87e1498df14d906596369d59775954204df)，发送了 20 笔转账仅使用了 
211,093 Gas 而要是传统转账则需要 20 * 21000 = 420,000，差不多节省了50%的 Gas 消耗。

所以中转合约特别适合小额转账，将多比小额转账合并一起，不仅节省手续费，而且还提高了以太坊网络的效率。实际使用在转出开始2笔包含及以上就可以节省矿工费使用。

不过需要注意的是，如果目标地址如果没有被初始化，那么会消耗更多的gas，因为地址在之前没有转入过 ETH，那么需要初始化这个地址的状态。根据黄皮书的描述，需要先消耗 25000 gas 创建这些地址，然后才花费 2300 gas 完成转账。实际上会比普通转账所花费 21000 gas 要多 6300 gas。

例如这个[交易](https://rinkeby.etherscan.io/tx/0x312423ffd79f22d08cdef0423271c18aa9cdd6b569851800bb0cc4eebe3f76f1)，发送给10个之前没有任何状态的地址，gas 消耗了 331981，比上面节省 gas 情况下多了10万多。不过第二次就会小很多，恢复到上文说明的节省手续费的状态。

另外需要注意的是，在使用这个合约的时候，这里接收地址参数必须非合约地址，因为接收地址是合约地址时，那么所需 gas 就不一定是 2300 了，如果要兼容这种情况需要改一下合约，使用 call 并指定金额 value，而不限定 gas。

```Solidity
function multi(Payment[] calldata payments) external payable {
    for (uint256 i = 0; i < payments.length; ++i) {
        Payment calldata item = payments[i];
        (bool success,) = item.to.call{value: item.value}(new bytes(0));
        require(success, "transfer failed");
    }
}
```

如果在商业项目中，如果我们能明确接收地址一定不是合约地址，那么就不需要这种形式。如果转出地址是其它方地址，那么需要注意防范重入攻击。如果我们发起方始终都是**外部账户**，那么这样最简单的方式直接判断发送方是不是主动调用者。

```Solidity
    function multi(Payment[] calldata payments) external payable {
       // 禁止非交易调用方调用
        if (msg.sender != tx.orgin) {
            return;
        }
        for (uint256 i = 0; i < payments.length; ++i) {
            Payment calldata item = payments[i];
            (bool success,) = item.to.call{value: item.value}(new bytes(0));
            require(success, "transfer failed");
        }
    }
```

如果发起方是合约账户，我们可以加上锁。

```Solidity
    uint256 private locked = 0;

    function multi(Payment[] calldata payments) external payable {
        if (locked == 1) {
            return;
        }
        locked = 1;
        for (uint256 i = 0; i < payments.length; ++i) {
            Payment calldata item = payments[i];
            (bool success,) = item.to.call{value: item.value}(new bytes(0));
            require(success, "transfer failed");
        }
        locked = 0;
    }
```

在实际应用中，也可以加上事件，外部应用能更好的捕捉到成功转出，不过这也增加gas消耗。

```Solidity
    event Transfer(address to, uint256 amount);

    function multi(Payment[] calldata payments) external payable {
        for (uint256 i = 0; i < payments.length; ++i) {
            Payment calldata item = payments[i];
            (bool success,) = item.to.call{value: item.value}(new bytes(0));
            require(success, "transfer failed");
            emit Transfer(item.to, item.value);
        }
    }
```

最后一提，这里使用 calldata 而不是 memory 来定义引用类型位置可以节省 gas 消耗。

> Calldata is a non-modifiable, non-persistent area where function arguments are stored, and behaves mostly like memory. It is required for parameters of external functions but can also be used for other variables.If you can, try to use calldata as data location because it will avoid copies and also makes sure that the data cannot be modified. https://solidity.readthedocs.io/en/v0.7.1/types.html#data-location

如上述文档所述，不过在实际测试中，使用了Solidity编译优化之后，Gas 节省效果并不那么明显，不过还是节省了一些。