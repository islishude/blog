---
layout: blockchain
title: solidity v0.5.0 主要破坏性更新示例
date: 2019-01-30 10:08:29
tags:
---

## 强制显式声明函数可见性

默认可见性声明被废弃，所有的函数和构造函数不再隐式声明 `public`，必须手动加上 `public`。而 `fallback` 和接口函数需要强制加上 `external`。

```solidity
pragma solidity ^0.5.3;

interface example {
    function add(uint x, uint y) external pure returns (uint);
}

contract Test is example {
    constructor() public {}

    function() external payable {}

    function add(uint x, uint y) public pure returns (uint) {
        uint z = x + y;
        assert(z >= x);
        return z;
    }
}
```

## 强制显式指定复合型数据类型位置

结构体、数组、映射等复合型数据需要指定数据位置，包括函数参数和返回值。另外 `external` 函数中的需要将复合类型参数指定为 `calldata`.

```solidity

contract Test {
    uint256[] public data;
    constructor(uint[] memory _data) public {
        data = _data;
    }
    
    function create(bytes memory _data) public pure returns(bytes memory) {
        return _data;
    }
}

interface Example {
    function create(address _key, string calldata _value, bytes32 _hash) external;
}
```

## address 类型扩展

合约不再隐式转换成 address 类型，需要手动转换。

```solidity
contract Test {
    constructor() public {}
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

`address` 分为 `address` 和 `address payable` 两种类型，只有后者可以调用 `transfer` 方法。

```solidity
pragma solidity ^0.5.3;

contract Test {
    address payable owner;
    constructor() public {
        owner = msg.sender;
    }
    
    function() external payable {}
    
    function transfer(address payable _to, uint _value) public {
        require(msg.sender == owner);
        require(address(this).balance >= _value);
        _to.transfer(_value);
    }

    function destroy() public {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}
```


## 函数变更

现在 `.call()` 合约调用函数和 `keccak256()` 哈希函数现在只接受一个 `bytes` 参数。

```solidity
pragma solidity ^0.5.3;

contract Test {
    constructor() public {}
    
    function create(address _from,bytes memory _data) public view returns(bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(address(this), _from, _data));
        return hash;
    }
}
```

另外 `.call()` 等合约调用函数返回值除了调用状态外，还包括了返回值。

```solidity
pragma solidity ^0.5.3;

contract Test {
    constructor() public {}

    function callTest() public view returns(bytes32){
        address con = address(0x0);
        bytes memory params = abi.encodeWithSignature("create(address,bytes)");
        (bool success, bytes memory result) = con.delegatecall(params);
        // ...
    }
}
```

以下函数正式被废弃：

- `callcode` 被废弃，推荐使用 `delegatecall`
- `suicide` 被废弃，推荐使用 `selfdestruct`
- `sha3` 被废弃，推荐使用 `keccak256`
