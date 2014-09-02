---
layout: post
title: "OpenNebula4.4入门之安装和节点配置"
date: 2013-12-19 10:51
comments: true
categories: 虚拟化
keywords: OpenNebula4.4
---

OpenNebula入门的PDF文档已可下载，[OpenNebula4.4入门配置](http://vdisk.weibo.com/s/EKoLFfHiE-oT/1387002741)，本博客连载更新相关内容


__本文内容目录组成如下__：

*   [环境说明](#env)
*   [软件包组成](#soft)
*   [Server端安装和配置](#server)
*   [节点端安装配置](#node_server)
*   [添加节点](#node_add)
    *   [onehost](#onehost)

<h2 id="env">环境说明</h2>
因为CentOS6.4虚拟化有很大的一个提升，所以系统环境管理端和节点宿主机都采用CentOS6.4 x86_64

<h2 id="soft">软件包组成</h2>
从OpenNebula官网下载[CentOS/RHEL 6](http://downloads.opennebula.org/packages/opennebula-4.4.0/CentOS-6/CentOS-6-opennebula-4.4.0-1.tar.gz)对应软件包或者加入OpenNebula源，直接下载软件包这里不再赘述，添加OpenNebula源方法如下：
``` bash
# cat << EOT > /etc/yum.repos.d/opennebula.repo
[opennebula]
name=opennebula
baseurl=http://downloads.opennebula.org/repo/CentOS/6/stable/\$basearch
enabled=1
gpgcheck=0
EOT
```

OpenNebula4.4主要有以下几个软件组成：
``` bash
# ls opennebula-*
opennebula-4.4.0-1.x86_64.rpm           //OpenNebula命令行指令
opennebula-flow-4.4.0-1.x86_64.rpm      //管理OpenNebula服务
opennebula-java-4.4.0-1.x86_64.rpm      //OpenNebula Java Api
opennebula-ozones-4.4.0-1.x86_64.rpm    //OpenNebula网页使用界面
opennebula-server-4.4.0-1.x86_64.rpm    //OpenNebula Server守护进程
opennebula-common-4.4.0-1.x86_64.rpm    //基本依赖性组件
opennebula-gate-4.4.0-1.x86_64.rpm      //使虚拟机和OpenNebula之间的通信
opennebula-node-kvm-4.4.0-1.x86_64.rpm  //元软件包，包括安装oneadmin用户、libvirt和kvm
opennebula-ruby-4.4.0-1.x86_64.rpm      //ruby依赖性组件
opennebula-sunstone-4.4.0-1.x86_64.rpm  //OpenNebula网页使用界面
opennebula-context-4.4.0-1.x86_64.rpm   //context组件
```

<h2 id="server">Server端安装和配置</h2>

为解决一些依赖关系，安装之前可以激活epel源，因为测试为CentOS6.4，因此激活方式如下：
``` bash
# rpm -ivh http://dl.fedoraproject.org/pub/epel/6Server/x86_64/epel-release-6-8.noarch.rpm
```

如果下载的是OpenNebula软件包，则进入解压目录，安装方式如下 [以下安装为组成Server端最基本的软件]：
``` bash
# yum localinstall opennebula-server-4.4.0-1.x86_64.rpm  \
opennebula-4.4.0-1.x86_64.rpm opennebula-common-4.4.0-1.x86_64.rpm \
opennebula-ruby-4.4.0-1.x86_64.rpm opennebula-sunstone-4.4.0-1.x86_64 -y
```

如果使用OpenNebula的源，安装如下：
``` bash
# yum install opennebula-server opennebula-sunstone -y
```

安装完成之后创建如下用户以及目录文件：
``` bash
# grep oneadmin /etc/passwd
oneadmin:x:9869:9869::/var/lib/one:/bin/bash
# ls -ld /etc/one/  //OpenNebula相关配置文件所在目录
drwxr-x---. 11 root oneadmin 4096 Aug 20 11:35 /etc/one/
# ls /etc/init.d/opennebula*
/etc/init.d/opennebula  /etc/init.d/opennebula-occi  /etc/init.d/opennebula-sunstone
# ls -ld /var/log/one/
drwxr-x---. 2 oneadmin oneadmin 4096 Jul 25 01:13 /var/log/one/
```

默认OpenNebula数据存储使用sqlite，如果需要使用MySQL，则需要做如下操作：  
__1.__  创建相关数据库：
``` bash
mysql> create database opennebula;
Query OK, 1 row affected (0.00 sec)

mysql> grant all privileges on opennebula.* to oneadmin@'localhost' identified by 'oneadmin';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)
```

__2.__  修改配置文件如下 [用户、端口、密码、库名和实际情况对应修改]：
``` bash
# vim /etc/one/oned.conf
… …
#DB = [ backend = "sqlite" ]
# Sample configuration for MySQL
DB = [ backend = "mysql", 
       server  = "localhost",
       port    = 3306,
       user    = "oneadmin", 
       passwd  = "oneadmin", 
       db_name = "opennebula" ]
… …
```

修改sunstone默认监听IP:
``` bash
# grep ':host' /etc/one/sunstone-server.conf 
:host: 127.0.0.1
# sed -i '/:host/s/127.0.0.1/192.168.80.130/g' /etc/one/sunstone-server.conf
# grep ':host' /etc/one/sunstone-server.conf 
:host: 192.168.80.130
```

启动相关服务:
``` bash
# /etc/init.d/opennebula start
# /etc/init.d/opennebula-sunstone start
# lsof -i:9869
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
ruby    22266 oneadmin    6u  IPv4 106746      0t0  TCP 192.168.80.130:9869 (LISTEN)
```

修改datastore:

OpenNebula默认用的是Shared Transfer Driver，这种模式比较适合快速部署和热迁移，只是要配置网络文件系统。如果没有网络文件系统，不想做热迁移，那么可以换成SSH Transfer Driver测试部署。
``` bash
$ onedatastore list
  ID NAME                SIZE AVAIL CLUSTER      IMAGES TYPE DS       TM      
   0 system                0M -     -                 0 sys  -        shared
   1 default            98.4G 85%   -                 1 img  fs       shared
   2 files              98.4G 85%   -                 0 fil  fs       ssh
$ onedatastore update 1
CLONE_TARGET="SYSTEM"
DISK_TYPE="FILE"
DS_MAD="fs"
LN_TARGET="SYSTEM"
TM_MAD="ssh"
TYPE="IMAGE_DS"
$ onedatastore list
  ID NAME                SIZE AVAIL CLUSTER      IMAGES TYPE DS       TM      
   0 system                0M -     -                 0 sys  -        shared
   1 default            98.4G 85%   -                 1 img  fs       ssh
   2 files              98.4G 85%   -                 0 fil  fs       ssh
```

修改过程产生如下错误：
``` bash
$ onedatastore update 1
Editor not defined
```

这是因为如下原因，CentOS默认vi位置是/bin/vi，添加相关链接即可
``` bash
# grep -i editor_path= /usr/lib/one/ruby/cli/one_helper.rb
EDITOR_PATH='/usr/bin/vi'
# ln -s /bin/vi /usr/bin/vi
```

用户名和密码通过以下方式获得：
``` bash
# cat /var/lib/one/.one/one_auth 
oneadmin:cd24c3a59c9fd8a7ab853b10247e8147
```

__注__：测试过程中因为测试环境服务端时间不对，导致cookie被忽略，OpenNebula Sunstone选择Keep me logged in一直登陆不上或者直接登陆很快退出，寻找原因花了很长时间，最后调整到正确时间，登陆显示ok。P.S: 时间是一个非常容易被我们忽略的问题，切记切记!

完成以上步骤之后，浏览器登陆 [http://ip:9869](http://ip:9869) 即可

<h2 id="node_server">节点端安装配置</h2>

软件包下载见Server端安装章节，节点只需要安装以下两个软件  
    opennebula-node-kvm-4.4.0-1.x86_64.rpm  
    opennebula-common-4.4.0-1.x86_64.rpm

yum安装以上软件即可，安装过程同时会安装虚拟化相关组件，包括bridge-utils、libvirt、qemu-kvm、qemu-img等。

桥接网络：
``` bash
# cat /etc/sysconfig/network-scripts/ifcfg-eth0 
DEVICE=eth0
TYPE=Ethernet
ONBOOT=yes
BRIDGE=br0
NAME="System eth0"
# cat /etc/sysconfig/network-scripts/ifcfg-br0
DEVICE=br0
ONBOOT=yes
TYPE=Bridge
BOOTPROTO=static
IPADDR=192.168.80.131
NETMASK=255.255.255.0
GATEWAY=192.168.80.2
```

修改之后，重启网络并查看确认：
``` bash
# service network restart
# brctl show
bridge name bridge id       STP enabled interfaces
br0     8000.000c2942e561   no      eth0
```

修改/etc/libvirt/qemu.conf的相关配置：
``` bash
user  = "oneadmin"
group = "oneadmin"
dynamic_ownership = 0
```

修改/etc/libvirt/libvirtd.conf相关配置：
``` bash
listen_tcp = 1          //OpenNebula使用libvirt提供的TCP协议
listen_tls = 0
```

修改/etc/sysconfig/libvirtd开启监听选项：
``` bash
LIBVIRTD_ARGS="--listen"
```

启动libvirtd服务：
``` bash
# /etc/init.d/libvirtd start
# netstat -tulnp | grep libvirt
tcp        0      0 0.0.0.0:16509               0.0.0.0:*                   LISTEN      2664/libvirtd
```

ssh无密码登陆：

ssh使用公钥认证无密码登陆这个比较简单，顺带也提一下，方法如下：

__管理端__
``` bash
# su - oneadmin
$ cat ~/.ssh/config     //增加超时时间，不询问直接添加主机到known_hosts文件
ConnectTimeout 5
Host *
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

__节点端__
``` bash
# su - oneadmin
$ vim .ssh/authorized_keys          //把管理端ssh公钥加入节点.ssh/authorized_keys文件
$ chmod 400 .ssh/authorized_keys
```

如此，Server端的oneadmin用户就可以无密码登陆节点oneadmin了。

<h2 id="node_add">添加节点</h2>
节点如此安装软件和配置之后便可以在Server端添加了，可以使用web添加，也可以使用命令添加。关于web界面的添加可以参考本人共享的pdf文档，这里不作具体的介绍，只介绍命令添加。

<h3 id="onehost">onehost命令</h3>
使用命令行添加主机也比较简单，这里使用的命令是__onehost__    

使用onehost命令删除之前web创建的主机，如下：
``` bash
$ su - oneadmin
$ onehost list
  ID NAME            CLUSTER   RVM      ALLOCATED_CPU      ALLOCATED_MEM STAT  
   1 192.168.80.131  -           0       0 / 400 (0%)     0K / 3.7G (0%) on    
$ onehost delete 1      //删除主机，可以是ID也可以是NAME
$ onehost list
  ID NAME            CLUSTER   RVM      ALLOCATED_CPU      ALLOCATED_MEM static
```

当然删除之后我们还是需要再创建一遍，虽然很无聊，But你懂的，如下
``` bash
$ onehost create 192.168.80.131 --im kvm --vm kvm --net dummy
ID: 2
$ onehost list
  ID NAME            CLUSTER   RVM      ALLOCATED_CPU      ALLOCATED_MEM STAT  
   2 192.168.80.131  -           0       0 / 400 (0%)     0K / 3.7G (0%) on    
```

    --im/-i:信息管理driver. 可选: kvm, xen, vmware, ec2, ganglia, dummy.
    --vm/-v: 虚拟化管理driver. 可选: kvm, xen, vmware, ec2, dummy.
    --net/-n: 虚拟网络driver. 可选: 802.1Q,dummy,ebtables,fw,ovswitch,vmware.

查看主机的详细信息 __onehost show__
```
$ onehost show 2
HOST 2 INFORMATION                                                              
ID                    : 2                   
NAME                  : 192.168.80.131      
CLUSTER               : -                   
STATE                 : MONITORED           
IM_MAD                : kvm                 
VM_MAD                : kvm                 
VN_MAD                : dummy               
LAST MONITORING TIME  : 11/29 22:19:21      

HOST SHARES                                                                     
TOTAL MEM             : 3.7G                
USED MEM (REAL)       : 111M                
USED MEM (ALLOCATED)  : 0K                  
TOTAL CPU             : 400                 
USED CPU (REAL)       : 0                   
USED CPU (ALLOCATED)  : 0                   
RUNNING VMS           : 0                   

… …
```

通过-x选项还可以以xml的格式显示主机相关信息
```
$ onehost show -x 2
<HOST>
  <ID>2</ID>
  <NAME>192.168.80.131</NAME>
  <STATE>2</STATE>
  <IM_MAD>kvm</IM_MAD>
  <VM_MAD>kvm</VM_MAD>
  <VN_MAD>dummy</VN_MAD>
  <LAST_MON_TIME>1385735001</LAST_MON_TIME>
  <CLUSTER_ID>-1</CLUSTER_ID>
  <CLUSTER/>
  <HOST_SHARE>
    <DISK_USAGE>0</DISK_USAGE>
    <MEM_USAGE>0</MEM_USAGE>
    <CPU_USAGE>0</CPU_USAGE>
    <MAX_DISK>0</MAX_DISK>
    <MAX_MEM>3916984</MAX_MEM>
    <MAX_CPU>400</MAX_CPU>
    <FREE_DISK>0</FREE_DISK>
    <FREE_MEM>3803128</FREE_MEM>
    <FREE_CPU>399</FREE_CPU>
    <USED_DISK>0</USED_DISK>
    <USED_MEM>113856</USED_MEM>
    <USED_CPU>0</USED_CPU>
    <RUNNING_VMS>0</RUNNING_VMS>
  </HOST_SHARE>
… …
```

onehost还有两个选项,disable和enable，disable表示不再监控该物理主机，但是不影响正在运行的虚拟机，enable表示开启监控
``` bash
$ onehost disable 0
$ onehost enable 0
```

--EOF--
