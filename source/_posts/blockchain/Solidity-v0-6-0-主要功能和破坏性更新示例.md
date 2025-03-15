---
title: Solidity v0.6.0 主要功能和破坏性更新示例
categories:
  - blockchain
date: 2020-09-21 22:31:26
tags:
---

## 重载关键字

和 C++ 中面向对象继承类似，Solidity 提供了 virtual 和 override 关键字。继承抽象合约或者合约接口需要加上 overide 关键字。

```Solidity
abstract contract Feline {
    function utterance() public virtual returns (bytes32);
    function running() public {
    }
}

contract Cat is Feline {
    function utterance() public override returns (bytes32) { return "miaow"; }
}
```

## 回退函数更改

```Solidity
contract Wallet {
    // 5.0 中用于接收以太坊的回退函数
    function () external payable { }

    // 6.0 需要更改为这样
    receive() external payable {}

    // 或者这样，如不接收 ETH 则 payable 为可选
    fallback() external payable {}
}
```

## 异常捕获

当进行外部非低级调用时，异常会冒泡到上层，v6.0 加入 try...catch 可以捕获到下层异常。

```Solidity
pragma solidity ^0.6.0;

interface DataFeed { function getData(address token) external returns (uint value); }

contract FeedConsumer {
    DataFeed feed;
    uint errorCount;
    function rate(address token) public returns (uint value, bool success) {
        // Permanently disable the mechanism if there are
        // more than 10 errors.
        require(errorCount < 10);
        try feed.getData(token) returns (uint v) {
            return (v, true);
        } catch Error(string memory /*reason*/) {
            // This is executed in case
            // revert was called inside getData
            // and a reason string was provided.
            errorCount++;
            return (0, false);
        } catch (bytes memory /*lowLevelData*/) {
            // This is executed in case revert() was used
            // or there was a failing assertion, division
            // by zero, etc. inside getData.
            errorCount++;
            return (0, false);
        }
    }
}
```

try 后接外部调用或者合约创建的表达式。当前版本仅支持 string 的错误类型，后续会增加更多错误类型，具体可以参考 try...catch [文档](https://solidity.readthedocs.io/en/v0.6.0/control-structures.html#try-catch)。


## 其它更新

1. array.push() 不再返回新长度
2. 增加数组容量不可使用 array.length++，需要改成 array.push()
3. 减少数组容量不可使用 array.length--，需要改成 array.pop()
4. 可以使用 payable(address) 强制转化 address 为 address payable
5. struct 和 enum 可以在文件全局声明
6. 更多更新可以参考[文档](https://solidity.readthedocs.io/en/latest/060-breaking-changes.html)或者[changelog](https://github.com/ethereum/solidity/releases/tag/v0.6.0)
