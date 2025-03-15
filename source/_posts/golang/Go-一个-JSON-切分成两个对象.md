---
title: 'Go: 一个 JSON 切分成两个对象'
categories:
  - Golang
date: 2019-01-30 10:13:03
tags:
---

```go
package main

import (
	"encoding/json"
	"fmt"
)

// User is
type User struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Blog is
type Blog struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func main() {

	b := new(Blog)
	u := new(User)

	json.Unmarshal([]byte(
		`{
			"email":"lishude",
			"password":"test",
			"title": "hello",
			"content": "content"
		}`),
		&struct {
			*User
			*Blog
		}{u, b})

	fmt.Println(b)
	fmt.Println(u)
}
```
