---
layout: post
title: "kvm 进程 ulimit 设置未生效"
description: "kvm ulimit"
---

## 一、问题描述

系统的 ulimit 设置生效，但是 kvm 本身的进程 open files 没有改变

```
# ulimit -HSn
655350
# grep -vE '^#|^$'  /etc/security/limits.conf       # 配置文件也没有问题
root soft nofile 655350
root hard nofile 655350
# grep -vE '^#|^$'  /etc/security/limits.d/90-nproc.conf
# RHEL 6 开始多了这个文件，不过这个文件默认只针对 nproc 的设置，和 nofile 没有关系
*          soft    nproc     1024
root       soft    nproc     unlimited
# cat /proc/58189/limits  | grep 'open files'       # kvm 的 open files 值没有改变
Max open files            1024                 4096                 files
```


## 二、问题处理

系统的 ulimit 设置是生效的，此时可以定位 limits 这块的配置我们是没有问题的，排除 limits 配置这块的问题，那就需要考虑 kvm 本身这块的问题。CentOS 和 kvm 相关服务主要是 libvirtd 服务，查看 `/etc/init.d/libvirtd` 启动进程脚本找到相关逻辑：

```
78      # LIBVIRTD_NOFILES_LIMIT from /etc/sysconfig/libvirtd is not handled
79      # automatically
80      if [ -n "$LIBVIRTD_NOFILES_LIMIT" ]; then
81          ulimit -n "$LIBVIRTD_NOFILES_LIMIT"
82      fi
```

如果这个值为空，则 kvm 默认就 fork 父进程即 init 相关值了，顺藤摸瓜查看配置文件 `/etc/sysconfig/libvirtd` 得到如下信息：

```
# Override the maximum number of opened files
#LIBVIRTD_NOFILES_LIMIT=2048
```

修改该值重启 libvirtd 服务，测试环境测试开启一个 kvm 虚拟机，发现配置生效：

```
# ulimit -HSn
65535
# grep -i nofiles /etc/sysconfig/libvirtd
LIBVIRTD_NOFILES_LIMIT=10240
# /etc/init.d/libvirtd restart
Stopping libvirtd daemon:                                  [  OK  ]
Starting libvirtd daemon:                                  [  OK  ]
# virt-install --name centos --ram=1024 --vcpus=1 --os-type=linux --os-variant=rhel6 --location /mnt/ --network bridge:br0 --disk path=/var/lib/libvirt/images/rhel6.img,size=10 --graphics vnc     # 安装 kvm 虚拟机测试
# pgrep qemu-kvm
2509
# grep files /proc/2509/limits                                              # 配置生效
Max open files            10240                10240                files
```

OK，至此问题解决。说了那么多废话，其实关键点就 `/etc/sysconfig/libvirtd` 中的 `LIBVIRTD_NOFILES_LIMIT` 变量值的修改。

--EOF--
