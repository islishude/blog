---
layout: python
title: Python模块和包管理
date: 2019-06-29 09:52:57
categories: 
  - python
tags:
---

## 模块和包

在 Python 中每一个 `.py` 都可以视作一个模块（module），而每一个包含 `__init__.py` 的目录则可以视作包（packge）。

如下所示，packs 因为包含 `__init__.py` 而可以看做是一个包，而 `packs/one.py` 则是一个模块。

```
├── main.py
├── packs
│   ├── __init__.py
│   └── one.py
└── readme.md

1 directory, 4 files
```

在 one.py 中简单定义了一个函数 One:

```python
def One():
    print("module one")


def OneOne():
    print("module one/one")
```

如果我们想要在 main.py 中使用的话，那么可以直接 import，这种方式也称之为“模块导入”。

```python
import packs

packs.one.One()
```

这里使用的同时加上了模块名称，当然也可以省略模块名，而这种方式称之为“成员导入”，这种方式比之前一种方式要快一些。

```python
from packs.one import One

One()
```

当我们运行后就会打印 `module one`，另外也可以看到在 packs 目录下生成一个 `__pycache__` 的新目录，这是编译后中间文件，可以提升模块载入速度。

如果当前模块有多个 `One` 名称导入的话，可以使用别名进行区分。如果有多个导入名称的话可以使用逗号进行分隔。

```python
from packs.one import One as Alias, OneOne

Alias()
OneOne()
```

如果要在一行导入的名称过多，也可以分行写

```python
from packs.one import One
from packs.one import OneOne

One()
OneOne()
```

当然也可以全部导入到当前模块，不过注意这种方式可能存在命名冲突，并且在一些 linter 工具下会提示必须使用全部的导入名称。

```python
from packs.one import *

One()
OneOne()
```

除了这种全局导入外，还可以在局部作用域导入。

```python
def main():
    from packs.one import One
    One()

main()
```

## init 文件

这里的 `__init__.py` 每当导入当前包的模块的时候就会运行一次。

现在在 `packs/__init__.py` 中加入一行 `print("packs one imported")` 的语句，然后运行，可以发现 `__init__.py` 是首先运行的。

```console
$ python3 main.py
packs one imported
module one
```

根据这个特点，我们可以再 `__init__.py` 输入导出的模块，外部使用的就不需要很长的导入路径了。

修改 `packs/__init__py` 为如下所示：

```python
from .one import One

print("packs one imported")
```

那么在 `main.py` 中就可以这样使用：

```python
from packs import One

One()
```

或者这样子：

```python
import packs

packs.One()
```

在深入一些，我们在 `packs` 文件夹下新建一个 `two` 包，然后修改 `main.py` 并导入这个包，类如下面

```console
$ tree .
.
├── main.py
├── packs
│   ├── __init__.py
│   ├── one.py
│   └── two
│       ├── __init__.py
│       └── two.py
└── readme.md

2 directories, 6 files

$ cat packs/two/__init__.py
print("packs two imported")

$ cat packs/two/two.py
def Two():
    print("module two")

$ cat main.py
from packs.two.two import Two

Two()
```

接着我们运行 `main.py`

```python
packs one imported
packs two imported
module two
```

可以看到两个 `__init__` 都被运行了，但是我们还不能使用 `packs.one.One` 这个函数，因为在 `main.py` 并没有导入这个名称。

## 相对路径和绝对路径引用

上面有使用类似这种带有相对路径的导入路径 `from .XXX`，这种代表从当前的 `XXX` 模块中导入名称。如果想要在 `packs/two/two.py` 中使用上一层的 `packs/one.py` 就可以使用 `from ..one import One` 的方式。

```python
# packs/two/__init__.py
from ..one import One

One()
```

以此类推，那么 `...` 代表更上一级。

但是这种方式还是有问题的，如果项目深度太大就容易写太多 `.`，还有一种方式就是绝对路径引用，这里的绝对路径是指相对项目根目录而言的，比如上述例子，那么就要修改为：

```python
# packs/two/__init__.py
from packs.one import One

One()
```

那引用当前目录的模块必须使用相对路径了，比如上述例子：

```python
# packs/two/__init__.py
from packs.one import One
from .two import Two

One()
```

注意，这里不能是 `from two import Two` 的形式！这个也好理解，因为绝对路径不是 `.` 开始的，如果相对路径不使用 `.` 开始，那么就得从项目根目录开始找了。

当然绝对路径的模块，就有一个 base 路径，所有的文件都是相对此 base 目录，如果在 IDE 中直接打开这里的模块，模块的根目录就是当前模块，显然就会提示找不到了对应的模块了。

## 模块搜索顺序

自己写的包名肯定可能和第三方或者标准库同名，不过这种同名通常没有问题。因为 python 会优先在当前目录搜索然后在环境变量的搜索路径，之后才是标准库和第三方包。

这个和 linux \$PATH 的环境变量一样，按照顺序来搜索。一旦导入每个模块就有全局的命名空间，第二次再次加载就会使用缓存。

这个路径搜索方式和 nodejs 有些区别，nodejs 是一旦同名，优先标准库，如果自定义一个 http 模块，那么永远不会被加载。

## pip 包管理工具

这一块比较简单，不过我感觉自己用的也不是特别熟练，这里先写写一般常用的操作。

#### 包管理

```
# 安装
# 最新版本
pip install Django
# 指定版本号
pip install Django==2.0.0
# 最小版本
pip install 'Django>=2.0.0'

# 升级包
pip install --upgrade Django
# 卸载包
pip uninstall SomePackage
# 搜索包
pip search SomePackage
# 显示安装包信息
pip show
# 查看指定包的详细信息
pip show -f SomePackage
# 列出已安装的包
pip list
# 查看可升级的包
pip list -o
```

#### 包依赖锁

```
pip freeze > requirement.txt # 锁版本
pip install -r requirement.txt # 指定安装版本
pip install --user install black # 安装到用户级目录
```

#### 使用镜像

```
pip install -r requirements.txt \
    --index-url=https://mirrors.aliyun.com/pypi/simple/ \
    --extra-index-url https://pypi.mirrors.ustc.edu.cn/simple/
```

#### 升级 pip

`pip install -U pip` 或者`sudo easy_install --upgrade pip`
