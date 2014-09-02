---
layout: post
title: "Ubuntu14.04重启网卡"
categories: UNIX/Linux
tags: [Linux, cmd]
---

> Stopping or restarting the networking job is not supported. Use ifdown & ifup to reconfigure desired interface.

Ubuntu14.04修改配置，重启网卡没有生效，出现如下问题：

``` bash
# cat /etc/issue
Ubuntu 14.04 LTS \n \l
# service  networking restart
stop: Job failed while stopping
start: Job is already running: networking
# tail -f /var/log/upstart/networking.log
Stopping or restarting the networking job is not supported.
Use ifdown & ifup to reconfigure desired interface.
```

从以上日志内容可以看出，传统的service重启和停止网络已经不再支持了，需要通过使用ifdown & ifup来实现相应的操作。

# 重启指定网卡

``` bash
# ifdown eth0 && ifup eth0
```

# 重启除lo网卡的所有网卡

``` bash
# ifdown --exclude=lo -a && sudo ifup --exclude=lo -a
```

# 配置桥接

``` bash
# apt-get install bridge-utils
# cat /etc/network/interfaces
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet manual

auto br0
iface br0 inet static
address 192.168.0.10
netmask 255.255.255.0
gateway 192.168.0.1
bridge_ports eth0
bridge_stp off
bridge_fd 0
bridge_maxwait 0
dns-nameservers 192.168.0.1
# ifup br0
# brctl  show
bridge name	bridge id		STP enabled	interfaces
br0		8000.02000a0080e1	no		eth0
```

* [Networking does not restart](https://bugs.launchpad.net/ubuntu/+source/ifupdown/+bug/1301015)

--EOF--
