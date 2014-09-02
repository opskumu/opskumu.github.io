---
layout: post
title: "ssh X11Forawarding占用OpenNebula kvm端口"
date: 2014-03-24 17:04
comments: true
categories: 虚拟化
---

虚拟机重建出现如下错误：
``` bash
$ virsh create deployment.0
error: Failed to create domain from deployment.0
error: Unable to read from monitor: Connection reset by peer
```

	
通过日志发现kvm端口被ssh占用
``` bash
# tail -f /var/log/libvirt/qemu/one-120.log
… …
inet_listen_opts: bind(ipv4,0.0.0.0,6010): Address already in use
… …
# netstat -tulnp | grep 6010
tcp        0      0 127.0.0.1:6010          0.0.0.0:*               LISTEN      28575/5
# ps -ef | grep 28575
root     28575  0.0  0.0  73484  3656 ?        Ss   13:03   0:00 sshd: root@pts/5
```
	
后查明原因是sshd_config配置文件默认开启`X11Forawarding`，`X11Forawarding`默认占用端口为6010开始，和OpenNebula kvm端口占用有冲突。另外，如果连接工具没有开启`X11Forawarding`，Server端也不会开启转发占用端口的，根本解决方法就是禁用`X11Forawarding`。

``` bash
# grep X11Forwarding /etc/ssh/sshd_config 
X11Forwarding no
# /etc/init.d/sshd restart
```

退出已登录的ssh连接，重新登录就不会出现端口占用的问题了，推荐默认关闭X11Forawarding，这在之前的文章[ssh的一些安全设定](http://kumu-linux.github.io/blog/2013/09/26/ssh-safe/)已经介绍过了。
