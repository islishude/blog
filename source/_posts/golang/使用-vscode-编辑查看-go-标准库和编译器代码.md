---
title: "使用 vscode 编辑查看 go 标准库和编译器代码"
date: 2023-09-08 01:56:54
slug: "golang/使用-vscode-编辑查看-go-标准库和编译器代码"
categories: ["Golang"]
tags: ["Go"]
---

如果直接使用 vscode 打开刚克隆下来的 go 标准库代码，那么会收到一堆错误。

第一，go 1.21 使用标准的 toolchain 版本约定，而 go 标准库始终会使用下一个版本号约定，所以 go 1.21 编译器无法在 go 1.22 上工作。

第二，go 标准库源码在 src 目录中，还有 misc 包，主目录是一个 workspace，而 go 目前对 go.work 这个配置没有明确的说明，一般都不会保留在代码库中。

第三，由于 GOROOT 的存在，并且标准库使用的 std 包是保留名称，所以即使解决上面两个问题，gopls 也无法工作。

为了解决这些问题，需要配置 .vscode 使用标准库当前目录作为 GOROOT 并且增加 go.work 配置文件。

第一步，克隆源码库，并进行编译

```console
$ git clone https://go.googlesource.com/go
$ cd go/src
$ ./make.bash                               
```

编译后的目录基本和 GOROOT 一致了，有了 bin 和 pkg 目录。

第二步，增加 .vscode 配置，使得 gopls 能够将当前目录作为 GOROOT

使用 `cmd+shift+p` (Mac) 打开命令工具，选择 Open Workspace Setting

![image](https://github.com/islishude/blog/assets/24730006/ca8f187f-7000-4f9a-b85e-6b0cbc833197)

```jsonc
{
  // Use the local go tool. This needs to be built with make.bash.
  "go.alternateTools": {
    "go": "~/codespace/github.com/go/bin/go"
  },

  //
  // Below is optional.
  //
  // Build a separate set of tools. For golang/vscode-go#294.
  "go.toolsGopath": "~/.vscode/godev",
  // Don't reformat HTML files since we have a custom style.
  "html.format.enable": false
}
```

我的当前的目录是 `~/codespace/github.com/go` ，所以你需要按照你的路径进行修改即可。

第三步，增加 workspace 配置


```console
$ ./bin/go work init misc src
```

增加完之后重新载入当前窗口，你会看到 gopls 已经能正确的识别代码库了。

如果你只想编辑标准库的代码，那么也可以把第二步 .vscode 放入 src 目录中就行了，但是你只能在 vscode 中打开 src 目录，而不是当前基目录。

第四步，增加 .gitignore

由于代码库没有将 .vscode 等上面生成的目录和文件添加到 .gitignore，我们需要手动添加这些目录和文件。

为了不修改 .gitignore 可以把这些放到 `.git/info/exclude` 中，具体如下所示：

```console
$ cat  .git/info/exclude
# git ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~

.vscode
go.work
go.work.sum
```

至此，所有步骤都完成了，现在可以愉快的使用 vscode 编辑 go 源码库了。

---

原文：[GitHub Issue #256](https://github.com/islishude/blog/issues/256)
