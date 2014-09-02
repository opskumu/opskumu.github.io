---
layout: post
title: "[1]salt install"
date: 2014-02-20 21:57
comments: true
categories: 运维利器
keywords: salt, install
---

## Install

First => repl源

rhel6
```
rpm -ivh \
http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
```


rhel5
```
rpm -ivh \
http://dl.fedoraproject.org/pub/epel/5/x86_64/epel-release-5-4.noarch.rpm
```

### Server
```
yum install salt-master
chkconfig salt-master on
service salt-master start  # salt-master -d也可以启动
```

### Client
```
yum install salt-minion
chkconfig salt-minion on
service salt-minion start  # salt-minion -d也可以启动
```

使用`--user`选项可以选择运行salt的用户

```    
salt-master -d --user test
salt-minion -d --user test
```

## Configure

### Master基本配置

`/etc/salt/master`主配置文件

```
... ...
interface: 192.168.80.131   # 取消外网监听
... ...
autosign_file: /etc/salt/autosign.conf  # 设定匹配主机自动接受key
... ...
```

restart生效
```
/etc/init.d/salt-master restart
```

### Client基本配置

`/etc/salt/minion`主配置文件

```
... ...
master: 192.168.80.131  # 取消外网监听
... ...
```

restart生效
```
service salt-minion restart
```

## 基本命令
```
# salt-key -L   # 列出当前所有key，包括接受、未接受、拒绝的key
Accepted Keys:
Unaccepted Keys:
kumu-ops-130.puppet.com
Rejected Keys:
# salt-key -A   # 接受所有未认证key
The following keys are going to be accepted:
Unaccepted Keys:
kumu-ops-130.puppet.com
Proceed? [n/Y] y
Key for minion kumu-ops-130.puppet.com accepted.
```

*   添加某个key, `salt-key -a keyname`
*   删除某个key，`slat-key -d keyname`

```
# salt kumu-ops-130.puppet.com test.ping
# salt '*' test.ping    # 测试所有主机连通性
```

### 匹配

* 匹配所有的Client
    * `salt '*' test.ping`
* 匹配符合条件的Client
    * `salt '*.example.net' test.ping`
    * `salt '*.example.*' test.ping`
* 单个匹配Client
    * `salt 'web?.example.net' test.ping`
* 匹配web1到web5
    * `salt 'web[1-5]' test.ping`
* 匹配web-x、web-y、web-z Client
    * `salt 'web-[x-z]' test.ping`
* 匹配web1-prod和web1-devel的Client
   * `salt -E 'web1-(prod|devel)' test.ping`
* 列表
   * `salt -L 'web1,web2,web3' test.ping`

### Grains
salt配备了一个获取底层信息的接口`Grains`，grains的信息都是静态信息，不可变的

* 匹配所有的CentOS Client：
    * `salt -G 'os:CentOS' test.ping`
* 查看grains分类:
    * `salt '*' grains.ls`     
* 查看grains所有信息:
    * `salt '*' grains.items`   
* osrelease查看grains某个信息:
    * `salt '*' grains.item`

### More...

查看salt更多的命令手册 `salt '*' sys.doc`
