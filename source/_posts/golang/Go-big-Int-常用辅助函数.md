---
title: 'Go: big.Int 常用辅助函数'
categories:
  - Golang
date: 2020-09-21 22:23:11
tags:
---

# 深拷贝

```go
package main

import (
	"fmt"
	"math/big"
)

func main() {
	var a = big.NewInt(100)
	var b = new(big.Int).Set(a)
	a.Add(a, big.NewInt(100))
	fmt.Println(a, b) // 200 100
}
```

# 判断值是否大于、小于或等于 0

如果 x <  0 返回 -1
如果 x == 0 返回 0
如果 x >  0 返回 +1

```go
package main

import (
	"fmt"
	"math/big"
)

func main() {
	var a = big.NewInt(1)
	var b = big.NewInt(-1)
	fmt.Println(a.Sign(), b.Sign())
}
```

如果判断是否为 0 那么也可以用这个，如果 BitLen() 返回 0 那么就是值为 0

```go
var a = new(big.Int)
fmt.Println(a.BitLen()) // Output: 0
```

# 转化为固定长度的 bytes

转化为 bytes 很简单，直接使用 Bytes() 即可，但转化的 bytes 只有值的最小字节长度。

```go
var a = big.NewInt(1)
fmt.Println(hex.EncodeToString(a.Bytes())) // Output: 01
```

如果要转化为固定长度，在 go 1.15 可以使用 FillBytes() 方法，这个比较配合适合 crypto 库使用

```go
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
)

func main() {
	a := big.NewInt(1)
	v := a.FillBytes(make([]byte, 32))
	fmt.Println(hex.EncodeToString(v))
        // Output:
        // 0000000000000000000000000000000000000000000000000000000000000001
}
```

# json.Number

bigint 进行 json 序列化的时候默认转化为 json.Number(float64)，但是值如果过大，那么会精度损失，最佳的方式转化为 decimal string 即可。这个比较复杂，我这里封装了一个库，可以直接使用。

```go
package main

import (
	"encoding/json"
	"fmt"

	"github.com/islishude/bigint"
)

func main() {
	a := bigint.New(100)
	data, err := json.Marshal(a)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(data)) // "100"
}
```

当然也直接 hex string json 反序列化。

```go
package main

import (
	"encoding/json"
	"fmt"

	"github.com/islishude/bigint"
)

func main() {
	type Object struct {
		Field bigint.Int
	}

	var d Object
	_ = json.Unmarshal([]byte(`{"Field": "0x3"}`), &d)
	fmt.Println(d.Field) // 3

	var e Object
	_ = json.Unmarshal([]byte(`{"Field": "0x"}`), &e)
	fmt.Println(e.Field) // <nil>
}
```

另外这个库也实现了 `driver.Valuer` 和 `sql.Scanner`，适用在数据库序列化使用。

```go
// sql.Scanner
var i Int
_ = db.QueryRow("SELECT i FROM example WHERE id=1;").Scan(&i)

// driver.Valuer
var i bigint.Int
_ = db.Exec("INSERT INTO example (i) VALUES (?);", i) // nullable
i = bigint.New(1024)
_ = db.Exec("INSERT INTO example (i) VALUES (?);", i)
```
