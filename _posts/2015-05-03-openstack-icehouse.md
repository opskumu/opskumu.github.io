---
layout: post
title: "CentOS 6.5 icehouse 多节点安装测试 (OVS+VLAN)"
description: "Openstack"
categories: virtualization
tags: [kvm, Openstack]
---

## 一、环境

VMware VM 2 台 「控制节点+计算节点」

* VM1（控制节点、网络节点、存储节点）
    * CPU：2 核
    * 内存：8G
    * 虚拟网卡： 2 个（eth0 外网网卡，eth1 内网网卡）
    * 磁盘：100G
    * IP：192.168.210.120
* VM2（计算节点）
    * CPU：2 核
    * 内存：8G
    * 虚拟网卡：2个（eth0 外网网卡，eth1 内网网卡）
    * 磁盘：100G
    * IP：192.168.210.121

配置好两台主机的主机名 FQDN，因为 rdo 实质上就是使用 puppet 做一系列的安装配置，这点需要提前配置好。


## 二、安装配置

* [Redhat RDO OpenStack 版本源](https://repos.fedorapeople.org/repos/openstack/)

根据相应的实际需求下载相应的版本，本测试用的是 [rdo-release-icehouse-4](https://repos.fedorapeople.org/repos/openstack/openstack-icehouse/rdo-release-icehouse-4.noarch.rpm)，yum 或者 rpm 安装即可。

### 2.1 网络配置

两台 VM 除 IP 和 MAC 外其它配置一致，VM1 的配置情况如下：

``` bash
# cat /etc/sysconfig/network-scripts/ifcfg-eth0
DEVICE="eth0"
BOOTPROTO="static"
ONBOOT="yes"
TYPE="Ethernet"
HWADDR=00:50:56:81:73:c6
IPADDR=192.168.210.120
NETMASK=255.255.252.0
GATEWAY=192.168.209.1
# cat /etc/sysconfig/network-scripts/ifcfg-eth1
DEVICE="eth1"
BOOTPROTO="static"
ONBOOT="yes"
TYPE="Ethernet"
HWADDR=00:50:56:81:f4:cb
IPADDR=10.0.128.101
NETMASK=255.255.255.0
```

### 2.2 yum 源配置

系统自带的源国内速度有点慢，这里我使用的阿里源

``` bash
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-6.repo
yum clean all
```

### 2.3 安装 Packstack Installer

以下安装操作都是在 VM1 即控制节点操作的。

``` bash
yum install -y openstack-packstack
```

### 2.4 运行 Packstack 安装 OpenStack

#### 生成安装配置文件

``` bash
packstack --gen-answer-file=multi-node.txt
```


根据实际需求修改 `multi-node.txt` 相应的配置选项

``` bash
CONFIG_CINDER_VOLUMES_CREATE=y                      # 如果之前已经配置 CINDER，则此处修改为 n
CONFIG_NOVA_COMPUTE_HOSTS=192.168.210.121
CONFIG_NEUTRON_OVS_TENANT_NETWORK_TYPE=vlan         # 这里网络模式使用 vlan
CONFIG_NEUTRON_OVS_VLAN_RANGES=physnet1:1:4094      # 设置 vlan ID value
CONFIG_NEUTRON_OVS_BRIDGE_MAPPINGS=physnet1:br-eth1 # 设置将 br-int 映射到桥 br-eth1（会自动创建 phy-br-eth1 和 int-br-eth1 来连接 br-int 和 br-eth1）
CONFIG_NEUTRON_OVS_BRIDGE_IFACES=br-eth1:eth1       # 设置 eth1 桥接到 br-eth1 上，即最后的网络流量从 eth1 流出 (会自动执行 ovs-vsctl add br-eth1 eth1)
```

#### 安装 OpenStack

``` bash
packstack --answer-file=multi-node.txt
```

#### 查看当前控制节点网络配置

配置 br-ex

``` bash
# cat /etc/sysconfig/network-scripts/ifcfg-eth0
DEVICE="eth0"
ONBOOT="yes"
HWADDR=00:50:56:81:73:c6
# cat /etc/sysconfig/network-scripts/ifcfg-br-ex
DEVICE="br-ex"
BOOTPROTO="static"
IPV6INIT="no"
MTU="1500"
ONBOOT="yes"
TYPE="Ethernet"
IPADDR=192.168.210.120
NETMASK=255.255.252.0
GATEWAY=192.168.209.1
# ovs-vsctl add-port br-ex eth0; service network restart    # 执行让配置生效
```

配置完成之后可以查看控制节点相关的网络配置

``` bash
# ovs-vsctl show
b371c7dc-3109-420f-90d4-f6089cc88c89
    Bridge "br-eth1"
        Port "br-eth1"
            Interface "br-eth1"
                type: internal
        Port "eth1"
            Interface "eth1"
    Bridge br-int
        fail_mode: secure
        Port "qr-0e11fafb-7d"
            tag: 3
            Interface "qr-0e11fafb-7d"
                type: internal
        Port "qr-cb9dc948-02"
            tag: 1
            Interface "qr-cb9dc948-02"
                type: internal
        Port patch-tun
            Interface patch-tun
                type: patch
                options: {peer=patch-int}
        Port "tap9843cc9c-63"
            tag: 1
            Interface "tap9843cc9c-63"
                type: internal
        Port "int-br-eth1"
            Interface "int-br-eth1"
        Port "tap85be25a8-24"
            tag: 3
            Interface "tap85be25a8-24"
                type: internal
        Port "qr-4a3ac452-6b"
            tag: 1
            Interface "qr-4a3ac452-6b"
                type: internal
        Port "tap8a63fc50-02"
            tag: 4
            Interface "tap8a63fc50-02"
                type: internal
        Port br-int
            Interface br-int
                type: internal
    Bridge br-ex
        Port "qg-73075998-82"
            Interface "qg-73075998-82"
                type: internal
        Port "qg-bd06cff1-2e"
            Interface "qg-bd06cff1-2e"
                type: internal
        Port "eth0"
            Interface "eth0"
        Port br-ex
            Interface br-ex
                type: internal
    Bridge br-tun
        Port br-tun
            Interface br-tun
                type: internal
        Port patch-int
            Interface patch-int
                type: patch
                options: {peer=patch-tun}
        Port "vxlan-c0a8d279"
            Interface "vxlan-c0a8d279"
                type: vxlan
                options: {in_key=flow, local_ip="192.168.210.120", out_key=flow, remote_ip="192.168.210.121"}
    ovs_version: "2.1.3"
```

安装过程中可能出现以下问题：

#### Cinder 问题

* SequenceError: Cinder's volume group 'cinder-volumes' could not be created

一开始申请的虚拟机磁盘为 20G，查看日志获知默认创建的 cinder 是 20G，所以猜测是 cinder 大小配置的问题，后修改配置文件中 CINDER 大小为 4G

``` bash
# grep CONFIG_CINDER_VOLUMES_SIZE  multi-node.txt
CONFIG_CINDER_VOLUMES_SIZE=4G
```

但依然出现以上的问题，可以通过如下方式解决该问题。

__创建独立的 Cinder 分区：__

``` bash
pvcreate /dev/sda2
vgcreate cinder-volumes /dev/sda2
```

或者

``` bash
dd if=/dev/zero of=/var/lib/cinder/cinder-volumes bs=1 count=0 seek=2048M
losetup /dev/loop2 cinder-volumes
pvcreate /dev/loop2
vgcreate cinder-volumes /dev/loop2
```

之前测试 RDO allinone 没有出现类似的问题。

#### rpm 包源的问题

* RPM file seems to be installed, but appropriate repo file is probably missing in /etc/yum.repos.d/

通过手动安装 epel 源包解决：

``` bash
rpm -ivh http://mirrors.zju.edu.cn/epel/6/x86_64/epel-release-6-8.noarch.rpm
```

epel 安装完毕之后又出现如下问题：

* Error: Cannot retrieve metalink for repository: epel. Please verify its path and try again

`mirrorlist` --> `baseurl`，注释 `/etc/yum.repos.d/epel.repo` [epel] 下 mirrorlist 行并取消 baseurl 行的注释。

``` bash
[epel]
... ...
baseurl=http://download.fedoraproject.org/pub/epel/6/$basearch
# mirrorlist=https://mirrors.fedoraproject.org/metalink?repo=epel-6&arch=$basearch
... ...
```

#### 其它问题

安装过程中的中断是很正常的，注意查看相关报错和日志基本可以解决相关问题，失败一次解决相应问题继续安装直到安装成功。


## 三、OpenStack Dashboard

浏览器访问 [http://192.168.210.120](http://192.168.210.120) 登陆 Dashboard，密码可以通过以下方式获取

``` bash
# cat ~/keystonerc_admin
export OS_USERNAME=admin
export OS_TENANT_NAME=admin
export OS_PASSWORD=12b58d1d10f44d94
export OS_AUTH_URL=http://192.168.210.120:5000/v2.0/
export PS1='[\u@\h \W(keystone_admin)]\$ '
```

## 四、参考文档

* [RDO Quickstart](https://www.rdoproject.org/Quickstart)
* [CentOS 6.4 Openstack Havana 多节点安装（OVS+VLAN）](http://www.chenshake.com/centos-6-4-openstack-havana-multinode-installation/)

--EOF--
