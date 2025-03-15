---
title: Linux sed 和 find 命令清单
categories:
  - Linux
date: 2018-05-19 22:52:41
tags:
  - sed
---

## sed

之前在使用 sed 就只在 ubuntu 上替换 apt 源用过。

```shell
sed -i 's/us/cn/g' /etc/apt/sources.lit
```

一直还没记住，容易输错，结果经常就把 sources.list 文件破坏掉了 😓。

sed 是流编辑器，读取一个文件，按照命令每次只处理一行。具体命令如下所示：

```
sed [options] 'command' file(s)
```

option 就是上述命令的 -i 部分，这个是修改源文件。处理行为默认是只输出到屏幕，加 -i 的参数了，这会修改源文件的。有个安全的方式就是使用 `-i.bak` 的形式先备份然后再修改。

**其它的 option 选项**

- -e<script>或--expression=<script>：以选项中的指定的script来处理输入的文本文件；
- -f<script文件>或--file=<script文件>：以选项中指定的script文件来处理输入的文本文件；
- -n或--quiet或——silent：仅显示script处理后的结果；
- -V或--version：显示版本信息。

command 参数包括两个部分，处理位置和处理方式。

sed 读取一行处理一行，默认是每行都处理，另外提供了处理位置（Address），可以是行号，也可以是正则只要匹配才处理，不匹配就跳过进入下一行。

选定行的范围使用 `,（逗号）`进行。

- 所有在模板test和check所确定的范围内的行都被打印：`sed -n '/test/,/check/p' file`
- 打印从第5行开始到第一个包含以test开始的行之间的所有行：`sed -n '5,/^test/p' file`
- 对于模板test和west之间的行，每行的末尾用字符串aaa bbb替换：`sed '/test/,/west/s/$/aaa bbb/' file`

在处理位置之后再使用处理方式。

几个常用的处理方式有新增（a），插入（i），删除（d），打印（p），替换（s）。

**输出打印操作：p命令**
- 打印第二行：`sed -n '2p' file`

需要注意的是如果不加 -n 的话，会打印两行。

**删除操作：d命令**
- 删除空白行：`sed '/^$/d' file`
- 删除文件的第2行：`sed '2d' file`
- 删除文件的第2行到末尾所有行：`sed '2,$d' file`

**追加（行下）：a\命令**
- 将 this is a test line 追加到 以test 开头的行后面：`sed '/^test/a\this is a test line' file`
- 在 test.conf 文件第2行之后插入：`sed -i '2a\this is a test line' test.conf`
- 也可以直接使用在命令`a`后加空格的形式： `sed -i '2a insert new lint'`

**插入（行上）：i\命令**
- 将 this is a test line 追加到以test开头的行前面：`sed '/^test/i\this is a test line' file`
- 在test.conf文件第5行之前插入：`sed -i '5i\this is a test line' test.conf`

当然还有最初说的 s 命令是指替换操作，可以直接搭配正规表示法。`sed -i 's/us/cn/g' /etc/apt/sources.lit` 这条命令就是把 `/etc/apt/sources.list` 文件中每行的 us 换成 cn，这个就是初始化 ubuntu server 的最常用的命令了。

## find

Linux find命令用来在指定目录下查找文件。

任何位于参数之前的字符串都将被视为欲查找的目录名。如果使用该命令时，不设置任何参数，则find命令将在当前目录下查找子目录与文件。并且将查找到的子目录和文件全部进行显示。

语法格式如下：

```
find   path   -option   [   -print ]   [ -exec   -ok   command ]   {} ;
```

find 根据下列规则判断 path 和 expression，在命令列上第一个 `- ( ) , ! `之前的部份为 path，之后的是 expression。如果 path 是空字串则使用目前路径，如果 expression 是空字串则使用 -print 为预设 expression。

- -atime n : 在过去 n 天过读取过的文件
- -ctime n : 在过去 n 天过修改过的文件
- -empty : 空的文件-gid n or -group name : gid 是 n 或是 group 名称是 name
- -name name, -iname name : 文件名称符合 name 的文件。iname 会忽略大小写
- -size n : 文件大小 是 n 单位，b 代表 512 位元组的区块，c 表示字元数，k 表示 kilo bytes，w 是二个位元组。
- -type c : 文件类型是 c 的文件。d: 目录；c: 字型装置文件；b: 区块装置文件；p: 具名贮列；f: 一般文件；l: 符号连结；s: socket
- -pid n : process id 是 n 的文件

更多可参考：https://blog.csdn.net/xktxoo/article/details/77823520

## REF
- http://man.linuxde.net/sed
- http://www.runoob.com/linux/linux-comm-find.html