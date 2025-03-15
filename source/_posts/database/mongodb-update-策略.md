---
layout: mongodb
title: mongodb update 策略
categories:
  - database
date: 2019-06-29 09:50:12
tags:
  - mongodb
---

mongo `update()` 指令包含是三个参数，如下所示：

```ts
db.collection.update(
   query: Document,
   update: Document,
   config?: {
     upsert?: boolean,
     multi?: boolean,
     writeConcern?: Document,
     collation?: Document,
     arrayFilters?: Document[]
   }
)
```

假设有如下数据：

```console
$ db.test.find()
{ "_id" : ObjectId("5ca467fe6e2bdd2db3166bdc"), "name" : "a", "grade" : 1 }
```

如果使用 update 命令执行如下语句：

```console
$ db.test.update({ name: 'a' }, { grade: 60 })
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```

这里 `update` 文档仅仅是 kv 数据，而不包含任何“更新运算符”，那么会替换整个文档，但 \_id 字段不会被更新。这个时候 `update` 文档也被称为“替换文档”。

```console
$ db.test.find()
{ "_id" : ObjectId("5ca467fe6e2bdd2db3166bdc"), "name" : 60 }
$ db.test.update({ name: 'a' }, { $set: { grade: 60 }})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
$ db.test.find()
{ "_id" : ObjectId("5ca467fe6e2bdd2db3166bdc"), "name" : "a", "grade" : 60 }
```

但如果 update 参数包含一个更新运算符的话，比如 `$set`，那么不会全部替换数据，而是更新已有数据。`$set` 是更新一个字段值的意思，如果 `$set` 后的字段不存在，那么就会新建这个字段。

常用的更新运算符除了上面的 $set 还有 $inc 运算符，\$inc 后跟正数或负数就代表增加或减少某个值大小。和 `$set` 一样，如果这个字段不存在，那么就会新建这个字段。不过如果这个字段不是数值类型那么就会报错。

```console
$ db.test.update({ name: 'a' }, { $inc: { name: 100}})
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 14,
		"errmsg" : "Cannot apply $inc to a value of non-numeric type. {_id: ObjectId('5ca467fe6e2bdd2db3166bdc')} has the field 'name' of non-numeric type string"
	}
})
```

update 函数可以使用第三个参数作为配置，常用的是 `upsert`，如果设置 `upsert` 为 `true`，那么如果这条记录不存在就会 insert 一条数据。

```console
$ db.test.find()
$ db.test.update({ name: 'b' }, { name: 'b', grade: 50 }, { $upsert: true } )
$ db.test.find()
{ "_id" : ObjectId("5ca467fe6e2bdd2db3166bdc"), "name" : "b", "grade" : 50 }
```

如果 `update()` 第二个参数 update 文档是替换文档，也就是说不包含任何更新运算符，那么就会直接使用替换文档插入一条数据，当然没有 `_id` 字段就会生这个字段。

```console
$ db.test.update({ name: 'c'}, { grade: 100 }, { upsert: true })
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ca472432832f7853835cf0d")
})
$ db.test.find()
{ "_id" : ObjectId("5ca472432832f7853835cf0d"), "grade" : 100 }
```

如果 update 参数包含了更新运算符的非替换文档，那么会使用 query 文档作为基础文档，然后使用 update 文档进行更新操作。

```console
$ db.test.update({ name: 'd' }, { $set: { grade: 1 }}, { upsert: true })
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ca473352832f7853835cf1e")
})
$ db.test.find()
{ "_id" : ObjectId("5ca473352832f7853835cf1e"), "name" : "d", "grade" : 1 }
```

但是如果 query 文档内包含“比较运算符”的话，那么就不会被把 query 文档包含进新文档内。

```console
> db.test.update({ grade: { $lt: 100 }}, { $set: { name: 'a' }}, { upsert: true })
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ca4744f2832f7853835cf38")
})
> db.test.find()
{ "_id" : ObjectId("5ca4744f2832f7853835cf38"), "name" : "a" }
```

不过由于 `{ key: { $eq: value} }` 比较运算符等同于 `{ key: value }`，这里就会把 query 文档包含进新文档。

```console
$ db.test.update({ name: { $eq: 'e' }}, { $set:{ grade: 100 }}, { upsert: true})
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ca473dd2832f7853835cf2d")
})
$ db.test.find()
{ "_id" : ObjectId("5ca473dd2832f7853835cf2d"), "name" : "e", "grade" : 100 }
```
