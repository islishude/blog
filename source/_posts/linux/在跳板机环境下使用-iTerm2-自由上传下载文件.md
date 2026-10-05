---
title: "在跳板机环境下使用 iTerm2 自由上传下载文件"
date: 2021-04-11 05:08:22
slug: "linux/在跳板机环境下使用-iTerm2-自由上传下载文件"
categories: ["Linux"]
tags: ["Linux", "CheatSheet"]
---

如果远程服务器可以自由与本地通信，那么最简单的方式就是 `scp` 命令

```sh
# upload
scp -i /path/to/ssh_key local_file remote_username@remote_ip:remote_folder 

# download
scp -i /path/to/ssh_key -r remote_username@remote_ip:remote_folder local_folder
```

但是存在跳板机这一个中间层，而且远程服务器不能直接连接，就不能直接使用这种方式。

因为可以通过 SSH 登录远程服务器，那么我们可以直接 SSH 环境下直接上传下载文件，这种方式类似于在 shell 中复制粘贴一样。

首先确认远程服务器和本机机器都安装了 `lszrz`

```
# Remote server
apt install -y lrzsz

# local machine
brew install lrzsz
```

然后下面脚本写入到 `/usr/local/bin/iterm2-zmodem`，**并使其可执行**。

update: brew 最新的安装的目录是 `/opt/homebrew/bin`，下面把这个路径增加到 $PATH 中。

```sh
# This is a re-implementation of the shell scripts "iterm2-recv-zmodem.sh" and
# "iterm2-send-zmodem.sh" found at https://github.com/mmastrac/iterm2-zmodem
#

# usage
if [[ $1 != "sz" && $1 != "rz" ]]; then
    echo "usage: $0 sz|rz"
    exit
fi

# send Z-Modem cancel sequence
function cancel {
	echo -e \\x18\\x18\\x18\\x18\\x18
}

# send notification using growlnotify
function notify {
    local msg=$1
    
    if command -v growlnotify >/dev/null 2>&1; then
        growlnotify -a /Applications/iTerm.app -n "iTerm" -m "$msg" -t "File transfer"
    else
        echo "# $msg" | tr '\n' ' '
    fi
}

#setup
[[ $LRZSZ_PATH != "" ]] && LRZSZ_PATH=":$LRZSZ_PATH" || LRZSZ_PATH=""

PATH=$(command -p getconf PATH):/opt/homebrew/bin:/usr/local/bin$LRZSZ_PATH
ZCMD=$(
    if command -v $1 >/dev/null 2>&1; then
        echo "$1"
    elif command -v l$1 >/dev/null 2>&1; then
        echo "l$1"
    fi
)

# main
if [[ $ZCMD = "" ]]; then
    cancel
    echo

    notify "Unable to find Z-Modem tools"
    exit
elif [[ $1 = "rz" ]]; then
    # receive a file
    DST=$(
        osascript \
            -e "tell application \"iTerm\" to activate" \
            -e "tell application \"iTerm\" to set thefile to choose folder with prompt \"Choose a folder to place received files in\"" \
            -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")"
    )
    
    if [[ $DST = "" ]]; then
        cancel
        echo 
    fi

	cd "$DST"
	
    notify "Z-Modem started receiving file"

    $ZCMD -e -y
    echo 

    notify "Z-Modem finished receiving file"
else
    # send a file
    SRC=$(
        osascript \
            -e "tell application \"iTerm\" to activate" \
            -e "tell application \"iTerm\" to set thefile to choose file with prompt \"Choose a file to send\"" \
            -e "do shell script (\"echo \"&(quoted form of POSIX path of thefile as Unicode text)&\"\")"
    )

    if [[ $SRC = "" ]]; then
        cancel
        echo 
    fi

    notify "Z-Modem started sending
$SRC"

    $ZCMD -e "$SRC"
    echo 

    notify "Z-Modem finished sending
$SRC"
fi
```

然后使用 iTerm2 依次打开 Preference -> Profile -> Advance -> Trigger Edit 配置

<img width="918" alt="" src="https://user-images.githubusercontent.com/24730006/116799931-23f4f200-ab2f-11eb-8470-c2d3bec8b756.png">

按照下面内容进行填写即可。

```
Regular expression: \*\*B0100
Action:             Run Coprocess
Parameters:         /usr/local/bin/iterm2-zmodem sz
instant: true

Regular expression: \*\*B00000000000000
Action:             Run Coprocess
Parameters:         /usr/local/bin/iterm2-zmodem rz
instant: true
```

最后进行测试：

在远程服务器运行 `rz` 本地就会弹出窗口要求选择要上传的文件，选择后即上传

![image](https://user-images.githubusercontent.com/24730006/114293161-87f34000-9ac6-11eb-8f7e-1286718b16af.png)

在远程服务器运行  `sz filename1 filename2 … filenameN`  本地就会弹出窗口要求保存文件，选择后即下载。

![image](https://user-images.githubusercontent.com/24730006/114293154-7316ac80-9ac6-11eb-8970-330b1f3e7b75.png)

---

原文：[GitHub Issue #249](https://github.com/islishude/blog/issues/249)
