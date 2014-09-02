---
layout: post
title: "使用pipework桥接docker"
date: 2014-06-04 17:24
comments: true
categories: 虚拟化
---

docker创建的时候，默认是接入docker0，只能单主机进行工作，但是在生产环境中往往不同主机的docker也是需要通信的，所以这里要借助另外一个工具，那就是pipework。


### 安装pipework

``` bash
$ git clone https://github.com/jpetazzo/pipework.git
$ sudo cp -rp pipework/pipework /usr/local/bin/
```
 
### 安装相应依赖软件
 
``` bash
$ sudo apt-get install arping bridge-utils -y
```
 
### 桥接网络
 
Ubuntu14.04
 
``` bash
# cat /etc/network/interfaces
auto lo
iface lo inet loopback
 
auto eth0
iface eth0 inet manual
 
auto br0
iface br0 inet static
address 192.168.0.219
netmask 255.255.255.0
gateway 192.168.0.254
bridge_ports eth0
bridge_stp off
bridge_fd 0
bridge_maxwait 0
dns-nameservers 192.168.0.254
```
 
### 启动br0，使桥接生效
 
``` bash
# ifup br0
# Bash=$(docker run -i -d -t 192.168.0.219:5000/ubuntu:14.04 /bin/bash)
# pipework br0 $Bash 192.168.0.223/24 
# 给指定容器添加虚拟网卡并桥接到br0，如此不同主机间的docker便可以通过br0通信了
```

### 拓展

关于进一步的内容[vlan| Open vSwitch | etc..]可以参考以下两篇文章：

* [pipework readme](https://github.com/jpetazzo/pipework/blob/master/README.md)
* [pipework-docker网络增强工具](http://peerxu.github.io/blog/2014/04/07/docker-with-openvswitch.html)

--EOF--
