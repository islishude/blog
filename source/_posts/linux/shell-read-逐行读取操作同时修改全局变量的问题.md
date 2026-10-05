---
title: "shell read 逐行读取操作同时修改全局变量的问题"
date: 2020-11-16 09:00:01
slug: "linux/shell-read-逐行读取操作同时修改全局变量的问题"
categories: ["Linux"]
tags: ["Linux"]
---

当文件没有可读的行时，read 命令将以非零状态退出，所以我们可以使用 while...read 逐行处理数据。

第一种，使用 cat 读取文件然后管道符传给 while...read

```sh
cat XXX | while read line;do
    # do anything...
done
```

第二种，使用输入重定向到 while...read 内

```sh
while read line;do
    # do anything...
done<XXX
```

如果同时操作的全局变量，比如这里有个例子，有一个文件内容需要在每行最后加上逗号 `,`，但最后一行不加，最后再就是折叠成一行的内容，如下所示

```console
$ cat text.txt
0
1
2
3
$ ./run.sh
0,1,2,3
```

那么很简单，如果按照第一种方式，我们可以这样做

```sh
#!/bin/sh

result=""

cat text.txt | while read line; do
    if [ -z "$result" ]; then
        result="$line"
    else
        result="$result,$line"
    fi
done

echo $result
```

但是这种方式永远输出为空，如果换成第二种方式就可以，这是为什么？

当使用pipeline 的时候启动一个子进程，那么这里 result 就相当于一个局部变量，不会修改全局变量。

ref: https://stackoverflow.com/questions/6255303/bash-piping-prevents-global-variable-assignment

---

原文：[GitHub Issue #242](https://github.com/islishude/blog/issues/242)
