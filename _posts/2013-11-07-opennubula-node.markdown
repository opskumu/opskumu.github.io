---
layout: post
title: "OpenNebula添加节点"
date: 2013-11-07 15:14
comments: true
categories: 虚拟化
keywords: OpenNebula
---


### 需求
The hosts must have a working installation of KVM, that usually requires:

* CPU with VT extensions
* libvirt >= 0.4.0
* kvm kernel modules (kvm.ko, kvm-{intel,amd}.ko). Available from kernel 2.6.20 onwards.
* the qemu user-land tools


笔者测试所用为VMware Workstation，除本身物理机支持并开启虚拟化外，Workstation也要开启相关配置[ 设置--处理器，查看是否开启 ]

### 节点软件安装

可以参见[OpenNebula在CentOS6.4安装备忘](http://kumu-linux.github.io/blog/2013/08/22/opennebula-install/)

``` bash
# yum install qemu-kvm qemu-img libvirt ruby \     
libvirt-python python-virtinst libvirt-client
# yum install opennebula-common-4.2.0-1.x86_64.rpm \
opennebula-node-kvm-4.2.0-1.x86_64.rpm
```

### 节点配置

#### 启动kvm

``` bash
# /etc/init.d/libvirtd start
```

#### 桥接网络

``` bash
# yum install bridge-utils -y
```

__桥接实例__:

``` bash
# cat /etc/sysconfig/network-scripts/ifcfg-eth0 
DEVICE=eth0
TYPE=Ethernet
ONBOOT=yes
NAME="System eth0"
BRIDGE="br0"
# cat /etc/sysconfig/network-scripts/ifcfg-br0
DEVICE="br0"
TYPE="Bridge"  # 注意大小写
BOOTPROTO="static"
IPADDR=192.168.80.131
NETMASK=255.255.255.0
GATEWAY=192.168.80.2
ONBOOT="yes"
DELAY=0
```

修改完毕，重启网络

#### 相关配置修改

修改/etc/libvirt/qemu.conf的相关配置：
``` bash
# grep -vE '^($|#)' /etc/libvirt/qemu.conf
user  = "oneadmin"
group = "oneadmin"
dynamic_ownership = 0
```

修改/etc/libvirt/libvirtd.conf相关配置：
``` bash
listen_tcp = 1
listen_tls = 0
mdns_adv = 0
unix_sock_group = "oneadmin"
unix_sock_ro_perms = "0777"
unix_sock_rw_perms = "0777"
auth_unix_ro = "none"
auth_unix_rw = "none"
```

修改/etc/sysconfig/libvirtd相关配置：
``` bash
LIBVIRTD_ARGS="--listen"
```

启动libvirtd服务[安全起见可以只监听内网IP]：
``` bash
# /etc/init.d/libvirtd restart
# netstat -tulnp | grep libvirtd
tcp        0      0 0.0.0.0:16509		0.0.0.0:*		LISTEN      50818/libvirtd      
tcp        0      0 :::16509			:::*			LISTEN      50818/libvirtd      
```

修改 /etc/sudoers 文件，最后一行加上：
``` bash
oneadmin ALL=(root)NOPASSWD:ALL
```

CentOS系统的sudo选项requiretty是默认打开的，远程执行命令时，ssh默认不会分配tty。没有tty，sudo就无法在获取密码时关闭回显。使用-tt选项强制SSH分配tty（使用两次-tt）。另一方面，sudoers中的Defaults选项requiretty要求只有拥有tty的用户才能使用sudo。可以通过visudo编辑配置文件，禁用这个选项：
``` bash
#Defaults    requiretty
```

添加`oneadmin`用户和OpenNebula Server主机ssh公钥认证，使得OpenNebula Server主机`oneadmin`用户可以使用公钥无密码登陆，关于ssh密钥配置这里不再进一步说明。


#### 其它配置
另外OpenNebula的脚本要用到/sbin/brctl，而CentOS的路径是/usr/sbin/brctl，添加软链接：
``` bash
ln -s /usr/sbin/brctl /sbin/brctl
```

还要用到/usr/bin/kvm，而CentOS没有链接，需要设置软链接：
``` bash
ln -s /usr/libexec/qemu-kvm /usr/bin/kvm
```

最后在Web上添加host主机节点即可，状态显示为`on`则表示添加成功。

--EOF--
