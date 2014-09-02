---
layout: post
title: "DNS chroot rsyslog配置"
date: 2013-05-21 10:53
comments: true
categories:  "UNIX/Linux"
keywords: dns,linux,chroot,rsyslog
---

## 问题描述

使用rsyslog获取dns查询日志，但是发现每次重启rsyslog服务，dns查询日志就不会再写入，必须重启dns才可以重新获得dns查询日志


环境： DNS查询日志存放独立分区/data/目录下 


## 问题解决

``` bash
# ps -ef | grep name[d]
named     9960     1  0 May20 ?        00:02:09 /usr/sbin/named-sdb -u named -t /var/named/chroot
# strace -fp 9960 
#使用strace跟踪named进程，在其它终端使用dig查询，截取到如下信息
... ...
[pid  9966] connect(6, {sa_family=AF_FILE, path="/dev/log"}, 110 <unfinished ...>
[pid  9963] recvmsg(537,  <unfinished ...>
[pid  9962] futex(0x7f520dc26028, FUTEX_WAKE_PRIVATE, 1) = 0
[pid  9963] <... recvmsg resumed> 0x7f5205eaec00, 0) = -1 EAGAIN (Resource temporarily unavailable)
[pid  9970] <... epoll_ctl resumed> )   = 0
[pid  9966] <... connect resumed> )     = -1 ENOENT (No such file or directory)
#信息显示没有/dev/log该文件
... ...
```

Google搜索`named chroot /dev/log`相关获得[CentOS 6: Configure bind logging with bind-chroot] (http://floriancrouzat.net/2011/09/centos-6-configure-bind-logging-bind-chroot-rsyslog/)

修改配置文件`/etc/rsyslog.conf`添加
```
$AddUnixListenSocket /var/named/chroot/dev/log
```

重启rsyslog,dig查询测试，DNS查询日志接收正常

``` bash
# ll /var/named/chroot/dev/log 
srw-rw-rw- 1 root root 0 May 21 11:30 /var/named/chroot/dev/log
```

## lsof查看效果
未添加`$AddUnixListenSocket /var/named/chroot/dev/log`测试，使用lsof查看rsyslog重启前后named程序占用/dev/log文件对比

``` bash
# lsof  -U -p 5986 | grep /dev/log
rsyslogd   5883    root    0u  unix 0xffff8801c10b1840      0t0 14544315 /dev/log
# lsof  -U -p 5986 | grep /dev/log
rsyslogd   5883    root    0u  unix 0xffff8801c2bc1580      0t0 14602737 /dev/log
```

添加`$AddUnixListenSocket /var/named/chroot/dev/log`后测试rsyslog重启前后named程序占用情况

``` bash
# lsof  -U -p 5986 | grep /dev/lo[g]
rsyslogd   5883    root    0u  unix 0xffff8801c2bedac0      0t0 14605223 /dev/log
rsyslogd   5883    root    1u  unix 0xffff8801b39c0840      0t0 14605225 /var/named/chroot/dev/log
# lsof  -U -p 5986 | grep /dev/lo[g]
rsyslogd   5883    root    0u  unix 0xffff8801c0913300      0t0 14630150 /dev/log
rsyslogd   5883    root    1u  unix 0xffff8801c2ba7d00      0t0 14630152 /var/named/chroot/dev/log
```

至于深层次的原因，目前还不是很了解，希望了解的朋友帮解一下。

--EOF--
