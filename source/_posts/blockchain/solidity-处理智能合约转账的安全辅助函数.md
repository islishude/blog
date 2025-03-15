---
title: solidity 处理智能合约转账的安全辅助函数
categories:
  - blockchain
date: 2020-09-21 22:15:26
tags:
---

在智能合约中处理转账，最常见是 Ether 和 ERC20Token 的转账。

在转账 Ether 时，一般我们直接使用 `<address payable>.transfer(uint256)`(或者 send) 函数，但是这个函数有个限制，只能使用 2300 gas，而且不能调整，这样就会出现一个问题，如果在合约内转给另一个合约地址，合约内对 fallback 方法做了额外的操作，这样消耗的 gas 就增加，进而交易会被 revert。

如下所示，如果使用转到下面这个合约，额外带有一个 event 会有额外的 gas 消耗，那么 transfer(send) 固定的 2300 gas 限制一定会失败。

```Solidity
pragma solidity ^0.7.0;

contract Wallet {
    event Deposit( address indexed sender,uint256 indexed amount );

    receive() payable external {
        emit Deposit(msg.sender, msg.value);
    }
}
```

我们可以使用下面函数就行封装，使用 call 方法并指定 value 即可，这样就可以事先调用 rpc 的 eth_estimateGas 接口来动态调整 gas limit。

```Solidity
function safeTransferETH(address to, uint value) internal {
    (bool success,) = to.call{value:value}(new bytes(0));
    require(success, 'ETH_TRANSFER_FAILED');
}
```

对于ERC20 的转账，一般我们会使用接口将地址转化合约对象方式来直接调用转账方法。

```Solidity
pragma solidity ^0.7.0;

interface ERC20 {	
    function transfer(address to, uint256 tokens) external returns (bool success);	
}

contract Manager {
    function ERC20Transfer(
        Token _token,
        address _to,
        uint256 _value
    ) public returns (bool) {
        return _token.transfer(_to, _value);
    }
}
```

但这有个问题，部分ERC20合约是使用了没有返回值非标准的函数接口，但 Solidity 编译器会把函数调用的返回值进行转换成接口定义的 bool 值，非标准合约调用会造成 revert。

在旧版本的 ^0.4.22 版本的 solidity 可以使用下面方式检查，代码来源自[sec-bit/badERC20Fix](https://github.com/sec-bit/badERC20Fix/blob/master/README_CN.md)

```Solidity
function isContract(address addr) internal {
    assembly {
        if iszero(extcodesize(addr)) { revert(0, 0) }
    }
}

function handleReturnData() internal returns (bool result) {
    assembly {
        switch returndatasize()
        case 0 { // not a std erc20
            result := 1
        }
        case 32 { // std erc20
            returndatacopy(0, 0, 32)
            result := mload(0)
        }
        default { // anything else, should revert for safety
            revert(0, 0)
        }
    }
}

function asmTransfer(address _erc20Addr, address _to, uint256 _value) internal returns (bool result) {
    // Must be a contract addr first!
    isContract(_erc20Addr);  
    // call return false when something wrong
    require(_erc20Addr.call(bytes4(keccak256("transfer(address,uint256)")), _to, _value));
    // handle returndata
    return handleReturnData();
}
```

当时的 address.call 方法调用只返回是否调用成功，所以需要加入很多汇编代码。但现在 address.call 方法除了返回是否调用成功外，还有了调用返回值。

```Solidity
<address>.call(bytes memory) returns (bool, bytes memory)
```

所以我们可以更加方便的进行数据判断：

```Solidity
function safeTransferERC20(address token, address to, uint value) internal {
    // bytes4(keccak256(bytes('transfer(address,uint256)')));
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
    // 如果返回值 data 不为空，那么解码为 bool 并判断是否为 true
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'ERC20_TRANSFER_FAILED');
}
```

对于 ERC20 这种调用方法，还需要注意一点，低级调用 call 方法，如果地址不是合约那么也会返回 true，所以这里为了安全，最好先保证地址为合约地址。

```Solidity
modifier OnlyContract(address token) {
     assembly {
         if iszero(extcodesize(token)) {
             revert(0, 0)
         }
     }
    _;
}
```

其它 ERC20 方法，类如 transferFrom 以及 approve 方法都可以同上面方式处理。


需要注意的是，这种处理 ERC20 的几个辅助函数也不是万能的，例如下面代码，transfer 调用了 _transfer() 方法，但是并没有返回值，所以始终会返回 false。

```Solidity
    function _transfer(address _from ,address _to, uint256 _value) internal returns (bool) {
        require(_to != address(0));
        require(_value <= _balances[msg.sender]);

        _balances[_from] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function transfer(address to, uint value) public returns (bool) {
        _transfer(msg.sender, to, value);
    }
```

这种不规范的合约还有很多，最简单的处理方式是单独处理特殊合约。
