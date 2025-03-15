---
title: MySQL upsert操作
categories:
  - database
date: 2019-08-19 20:53:08
tags:
---

upsert 操作是说如果这条记录存在（含有 unique key 或 primary key 的字段存在）那么就更新，否则就插入一条新的记录。

首先创建一张新表，包含一个主键约束 id

```sql
CREATE TABLE users(
id int unsigned primary key auto_increment,
name varchar(2) not null
);
```

然后插入多条数据：

```sql
INSERT INTO users(name) VALUES ('a'), ('b'), ('c');
```

如果现在要插入 id 为 2 的记录，那么就会报错：

```
mysql> insert users values(2,"test");
ERROR 1062 (23000): Duplicate entry '2' for key 'PRIMARY'
```

如果简单改一下，就不会报错了：

```sql
INSERT INTO users(id, name) values (2, "test") on duplicate key update name="test";
```

或者将 update 设置为取 values

```sql
INSERT INTO users(id, name) values (2, "test") on duplicate key update name=VALUES(name);
```

提示 `Query OK, 2 rows affected (0.01 sec)`

查看一下数据，确实也更新了：

```
mysql> select * from users where id = 2;
+----+------+
| id | name |
+----+------+
|  2 | test |
+----+------+
1 row in set (0.00 sec)
```

如果插入一条不会重复 id 的记录的话，就正常 insert 了：

```sql
INSERT INTO users VALUES(4, 'xiaoming') ON DUPLICATE KEY UPDATE name=VALUES(name);
```

提示：`Query OK, 1 row affected (0.01 sec)`
