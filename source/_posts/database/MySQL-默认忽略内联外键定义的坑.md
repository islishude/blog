---
title: MySQL 默认忽略内联外键定义的坑
categories:
  - database
date: 2019-01-30 10:12:07
tags:
---

创建一个省份表

```sql
CREATE TABLE `provinces` (
  `pid` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL
);

```

然后 User 表中的 `province` 字段关联省份表的 `pid` 字段

```sql
CREATE TABLE `users` (
    `uid` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `province` SMALLINT NOT NULL REFERENCES `province` (`pid`)
);
```

这一步没有报错。

但是查看 `users` 表中的所有索引时

```
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| users |          0 | PRIMARY  |            1 | uid         | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
1 row in set (0.06 sec)
````


只有 `uid` 主键的索引定义！

这十分奇怪啊，然后我又查找了标准 SQL 语法，我这里的定义并没有错误。

```sql
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
    (create_definition,...)
    [table_options]
    [partition_options]

create_definition:
    col_name column_definition
  | [CONSTRAINT [symbol]] PRIMARY KEY [index_type] (key_part,...)
      [index_option] ...
  | {INDEX|KEY} [index_name] [index_type] (key_part,...)
      [index_option] ...
  | [CONSTRAINT [symbol]] UNIQUE [INDEX|KEY]
      [index_name] [index_type] (key_part,...)
      [index_option] ...
  | {FULLTEXT|SPATIAL} [INDEX|KEY] [index_name] (key_part,...)
      [index_option] ...
  | [CONSTRAINT [symbol]] FOREIGN KEY
      [index_name] (col_name,...) reference_definition
  | CHECK (expr)

column_definition:
    data_type [NOT NULL | NULL] [DEFAULT {literal | (expr)} ]
      [AUTO_INCREMENT] [UNIQUE [KEY]] [[PRIMARY] KEY]
      [COMMENT 'string']
      [COLLATE collation_name]
      [COLUMN_FORMAT {FIXED|DYNAMIC|DEFAULT}]
      [STORAGE {DISK|MEMORY|DEFAULT}]
      [reference_definition]
  | data_type
      [GENERATED ALWAYS] AS (expression)
      [VIRTUAL | STORED] [NOT NULL | NULL]
      [UNIQUE [KEY]] [[PRIMARY] KEY]
      [COMMENT 'string']

reference_definition:
    REFERENCES tbl_name (key_part,...)
      [MATCH FULL | MATCH PARTIAL | MATCH SIMPLE]
      [ON DELETE reference_option]
      [ON UPDATE reference_option]

reference_option:
    RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT
```

之后我尝试了不使用内联的方式，然后就成功了！

```sql
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'user id',
  `province` smallint(5) unsigned NOT NULL,
  `name` varchar(20) NOT NULL COMMENT 'user name',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`province`) REFERENCES `provinces` (`pid`)
)
```

然后找了 MySQL 相关文档之后，才发现这是个 feature 不是个 bug，**在 MySQL 内联外键会解析但是会忽略**。

> MySQL parses but ignores “inline REFERENCES specifications” (as defined in the SQL standard) where the references are defined as part of the column specification. MySQL accepts REFERENCES clauses only when specified as part of a separate FOREIGN KEY specification.

现在是特别不明白 MySQL 这么多坑，为什么国内还会有这么多公司用。。
