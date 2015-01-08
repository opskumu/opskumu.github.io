---
layout: page
title: "Linux Tips"
description: "Linux Tips"
---
{% include JB/setup %}

<u>__1__、给 __man__ 一点颜色看看</u>

在 `~/.bashrc` 或者 `~/.bash_profile` 中加入如下内容,`source` 即可生效

``` bash
export LESS_TERMCAP_mb=$'\E[01;31m' 
export LESS_TERMCAP_md=$'\E[01;31m' 
export LESS_TERMCAP_me=$'\E[0m' 
export LESS_TERMCAP_se=$'\E[0m' 
export LESS_TERMCAP_so=$'\E[01;44;33m' 
export LESS_TERMCAP_ue=$'\E[0m' 
export LESS_TERMCAP_us=$'\E[01;32m' 
```

<u>__2__、通过文件添加 __Swap__ 分区</u>

* a、生成实际需求大小的文件
	* `dd if=/dev/zero of=/swapfile bs=1024 count=65536`
* b、把生成的文件格式化成 swap
	* `mkswap /swapfile`
* c、使 swap 文件生效，但是自动重启之后就会失效
	* `swapon /swapfile`
* d、加入以下内容到 /etc/fstab 配置文件中使重启 swap 自动生效
	* `/swapfile swap swap defaults 0 0`
* e、关闭 
	* `swapoff /swapfile` 并删除 `/etc/fstab` 文件中内容



<u>__3__、查看某个进程占用 __Swap__ 大小</u>

* 方法1、`top` 按 `f` 键输入 `p` 回车即可 
* 方法2、`grep --color -i swap /proc/pid/status`

<u>__4__、RHEL 常用 Yum 源</u>

* 源1、[epel 企业版 Linux 附加软件包](http://fedoraproject.org/wiki/EPEL/zh-cn) 
* 源2、[RepoForge ](http://repoforge.org/use/) CentOS 社区认为是最安全也是最稳定的一个软件仓库
* 源3、[网易163 mirrors](http://mirrors.163.com/.help/centos.html) [搜狐 mirrors](http://mirrors.sohu.com/help/centos.html) [阿里 mirrors](http://mirrors.aliyun.com/help/centos)

<u>__5__、bash history 记录命令执行时间</u>

``` bash
kumu-opsdev ~ # export HISTTIMEFORMAT='%F %T '
kumu-opsdev ~ # history | less
   39  2013-07-31 09:54:33 ls
   40  2013-07-31 09:54:35 su - test
   41  2013-07-31 09:54:39 ls
   42  2013-07-31 10:54:40 chmod 700 a 
```

<u>__6__、避免程序因网络原因/窗口意外断开中断</u>

* 使用 [tmux](http://kumu-linux.github.io/blog/2013/08/06/tmux/)/[screen](http://www.ibm.com/developerworks/cn/linux/l-cn-screen/)等工具
* 使用 `nohup 程序名 &` 或者 `setsid 程序名 &` 或者 `(命令名 &)` [参考文章](http://hi.baidu.com/xtyangjie/item/3f5aaff7e9c145de6225d23f)
* 如果服务已经在运行了，则可以使用`disown`来完成
	* 1、`Ctrl+z` 使当前程序睡眠
	* 2、`jobs` 查看后台id号
	* 3、`bg %jobid` 让程序后台运行
	* 4、`disown -h %jobid` 使运行程序忽略 HUP 信号

<u>__7__、Linux终端录制和回放</u>

* `script` 和 `scriptreplay` 命令 
* 【 script 负责录制 | scriptreplay 负责回放 】 [参考文章](http://blog.csdn.net/signmem/article/details/8734476)

```
# script -t 2> test.time -a test.txt    # 录制，存入历史到test.txt
... ...
# exit                                  # 退出录制
# scriptreplay test.time test.txt       # 终端回放
```

<u>__8__、退出无响应的ssh连接</u>

* 快捷键 `~.` [波浪线和点]

<u>__9__、ssh 配置文件定义 ssh 连接端口</u>

* 为方便连接，可以在 `~/.ssh/config` 文件中定义 ssh 连接端口和私钥等

```
# ~/.ssh/config
HOST 172.16.*.*
    Port 22222
    IdentityFile ~/.ssh/kumu_id_rsa
```

<u>__10__、vim 分屏功能</u>

* vim 打开多个文件横屏 `-o` 选项: `vim -o2 /etc/passwd test1 test2` [n 是数字，表示分成几个屏]
    * 上下切换使用 `Ctrl+w` + 上下方向键
* vim 打开多个文件竖屏`-O` 选项: `vim -O2 /etc/passwd test1 test2` [n 是数字，表示分成几个屏]
    * 上下切换使用 `Ctrl+w` + 左右方向键
* 在 vim 中打开文件分屏
    * `split 文件名` 横屏
    * `vsplit 文件名` 竖屏

<u>__11__、显示 bash 当前所在层级</u>

* 变量 `SHLVL`

```
kumu-opsdev ssh # echo $SHLVL
2 
```

<u>__12__、清空内存缓存</u>

``` bash
sync; echo 3 > /proc/sys/vm/drop_caches
```

<u>__13__、rsync 同步目录指定文件</u>

有时候有需求只同步 rsync 库中单个文件，则可以通过如下方式同步

``` bash
RSYNC_PASSWORD=your_pass rsync -az --include=filename --exclude=* \
    test@test.com::test /test/
```

<u>__14__、crontab 百分号</u>

当写 crontab 时，如果命令中有 % 号的时候，需要使用\转移，否则计划任务会执行失败

<u>__15__、ssh controlmaster 选项</u>

有时用 ssh 使用密码登陆多个相同主机时，为避免多次输入密码，可以在 `~/.ssh/config` 文件中加入如下选项

``` bash
Host *
    controlmaster auto
    controlPath ~/.ssh/master-%r@%h:%p  # 会话保存位置和格式
```

__更多 Tips 详见__ -- [日常问题处理 Tips](https://github.com/opskumu/script/blob/master/tips/tips.md)
