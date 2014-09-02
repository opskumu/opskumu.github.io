---
layout: post
title: "Openebula镜像制作"
date: 2014-04-25 20:45
comments: true
categories: 虚拟化
---

`qemu-img`和`qemu-kvm`命令是制作系统镜像的重要工具，在介绍这两个工具之前，稍微简单说明下虚拟机镜像格式，目前虚拟机有多种镜像格式可供选择，常见的有如`raw`、`vdi`、`qcow2`、`vmdk`、`qed`、`vhd`等格式。


## qemu-img  

`qemu-img`是QEMU的磁盘管理工具，支持多种虚拟镜像格式
  
``` bash
$ qemu-img -h | grep Supported
Supported formats: raw cow qcow vdi vmdk cloop dmg bochs vpc vvfat 
qcow2 qed parallels nbd blkdebug host_cdrom host_floppy host_device file
```

`qemu-img`默认创建的格式是`raw`，man手册中对几种格式也都有介绍。以下为对raw和qcow2镜像的详细介绍：

### raw

原始的磁盘镜像格式，qemu-img默认支持的格式，它的优势在于它非常简单而且非常容易移植到其他模拟器（emulator，QEMU 也是一个emulator）上去使用。如果客户机文件系统（如Linux上的ext2/ext3/ext4、Windows的NTFS）支持“空洞” （hole），那么镜像文件只有在被写有数据的扇区才会真正占用磁盘空间，从而有节省磁盘空间的作用。`qemu-img`默认的`raw`格式的文件其实是稀疏文件（sparse file）[*稀疏文件就是在文件中留有很多空余空间，留备将来插入数据使用。如果这些空余空间被ASCII码的NULL字符占据，并且这些空间相当大，那么，这个文件就被称为稀疏文件，而且，并不分配相应的磁盘块。*]，dd命令创建的也是raw格式，不过dd一开始就让镜像实际占用了分配的空间，而没有使用稀疏文件的方式对待空洞而节省磁盘空间。尽管一开始就实际占用磁盘空间的方式没有节省磁盘的效果，不过它在写入新的数据时不需要宿主机从现有磁盘空间中分配，从而在第一次写入数据时性能会比稀疏文件的方式更好一点。简单来说，raw有以下几个特点：
    
*   寻址简单，访问效率高
*   可以通过格式转换工具方便地转换为其它格式
*   格式实现简单，不支持压缩、快照和加密
*   能够直接被宿主机挂载，不用开虚拟机即可在宿主和虚拟机间进行数据传输

### qcow2

`qcow2`是qcow的一种改进，是Qemu实现的一种虚拟机镜像格式。更小的虚拟硬盘空间（尤其是宿主分区不支持hole的情况下），支持压缩、加密、快照功能，磁盘读写性能较raw差。


### qemu-img它支持的命令分为如下几种

* （1）check [-f fmt] filename
  
对磁盘镜像文件进行一致性检查，查找镜像文件中的错误，目前仅支持对`“qcow2”`、`“qed”`、`“vdi”`格式文件的检查。其中，`qcow2`是 QEMU 0.8.3版本引入的镜像文件格式，也是目前使用最广泛的格式。`qed`（QEMU enhanced disk）是从QEMU 0.14版开始加入的增强磁盘文件格式，为了避免qcow2格式的一些缺点，也为了提高性能，不过目前还不够成熟。而`vdi`（Virtual Disk Image）是Oracle的VirtualBox虚拟机中的存储格式。参数-f fmt是指定文件的格式，如果不指定格式`qemu-img`会自动检测，`filename`是磁盘镜像文件的名称（包括路径）。

``` bash
$ qemu-img check CentOS6.4-x86_64.qcow2 
No errors were found on the image.
```

* （2）create [-f fmt] filename [size]
  
创建一个格式为fmt大小为size文件名为filename的镜像文件。  

``` bash
$ qemu-img create -f qcow2 test.qcow2 10G
Formatting 'test.qcow2', fmt=qcow2 size=10737418240 encryption=off cluster_size=65536 
$ qemu-img create -f qcow2 test.raw 10G
Formatting 'test.raw', fmt=qcow2 size=10737418240 encryption=off cluster_size=65536
```

> __注意__：这里的qcow2后缀只是为了便于自己区分格式方便，如果不加后缀也可以通过qemu-img来获取镜像的格式。

* （3）info [-f fmt] filename
  
显示filename镜像文件的信息。如果文件是使用稀疏文件的存储方式，也会显示出它的本来分配的大小以及实际已占用的磁盘空间大小。如果文件中存放有客户机快照，快照的信息也会被显示出来。

``` bash
$ qemu-img info test.qcow2 
image: test.qcow2
file format: qcow2
virtual size: 10G (10737418240 bytes)
disk size: 136K
cluster_size: 65536
$ qemu-img info test.raw    //qemu-img生成raw格式镜像也是采用稀疏文件方式存储的
image: test.raw
file format: qcow2
virtual size: 10G (10737418240 bytes)
disk size: 136K
cluster_size: 65536
$ dd </dev/zero >test.dd bs=1MB count=1000
1000+0 records in
1000+0 records out
1000000000 bytes (1.0 GB) copied, 1.80597 s, 554 MB/s
$ qemu-img info test.dd //可以看到dd产生的格式也是raw格式的，并且没有用到稀疏存储方式
image: test.dd
file format: raw
virtual size: 954M (1000000000 bytes)
disk size: 954M
```

* （4） convert [-c] [-f fmt] [-O output_fmt] [-o options] filename [filename2 [...]] output_filename
  
镜像格式转换，将fmt格式的filename镜像文件根据options选项转换为格式为`output_fmt`的名为`output_filename`的镜像文件。它支持不同格式的镜像文件之间的转换，比如可以用VMware用的vmdk格式文件转换为qcow2文件，这对从其他虚拟化方案转移到KVM上的用户非常有用。一般来说，输入文件格式fmt由qemu-img工具自动检测到，而输出文件格式output_fmt根据自己需要来指定，默认会被转换为与raw文件格式（且默认使用稀疏文件的方式存储以节省存储空间）。
其中，`“-c”`参数是对输出的镜像文件进行压缩，不过只有qcow2和qcow格式的镜像文件才支持压缩，而且这种压缩是只读的，如果压缩的扇区被重写，则会被重写为未压缩的数据。同样可以使用`“-o options” `来指定各种选项，如：后端镜像、文件大小、是否加密等等。使用`backing_file`选项来指定后端镜像，让生成的文件是`copy-on-write`的增量文件，这时必须让转换命令中指定的后端镜像与输入文件的后端镜像的内容是相同的，尽管它们各自后端镜像的目录、格式可能不同。
  
如果使用`qcow2`、`qcow`、`cow`等作为输出文件格式来转换`raw`格式的镜像文件（非稀疏文件格式），镜像转换还可以起到将镜像文件转化为更小的镜像，因为它可以将空的扇区删除使之在生成的输出文件中并不存在。

``` bash
$ qemu-img info test.dd 
image: test.dd
file format: raw
virtual size: 954M (1000000000 bytes)
disk size: 954M
$ qemu-img convert -O qcow2  test.dd test_qcow2.qcow2
$ qemu-img info test_qcow2.qcow2 
image: test_qcow2.qcow2
file format: qcow2
virtual size: 954M (1000000000 bytes)
disk size: 136K
cluster_size: 65536
```

以上介绍了`qemu-img`的基本使用方法之后，关于`qemu-img`的更多高级用法可以参考man手册

### qemu-kvm
  
#### 新建测试镜像

因为qcow2的一些特性，这里采用qcow2格式制作系统镜像

``` bash
# qemu-img create -f qcow2 CentOS6.4-x86_64-tpl.qcow2 8G
# chown oneadmin:oneadmin CentOS6.4-x86_64-tpl.qcow2
Formatting 'CentOS6.4-x86_64-tpl.qcow2', fmt=qcow2 size=8589934592 encryption=off cluster_size=65536 
```

#### 安装系统

``` bash
# /usr/libexec/qemu-kvm -m 1024 -cdrom /data/images/CentOS-6.4-x86_64-bin-DVD1.iso -drive \
file=/data/images/CentOS6.4-x86_64-tpl.qcow2,if=virtio -net nic,model=virtio \
-net tap,script=no  -boot d -nographic -vnc :0
```
  
上面命令参数解释如下：

    -m                      指定内存大小
    -cdrom                  指定系统iso镜像
    -drive file=xx,if=xx    指定硬盘镜像,file=镜像文件名,if=镜像格式类型
    -net nic,model=xx       表示网卡配置,model=模拟网卡类型,默认rt18139
    -net tap,script=no      虚拟设备，桥接网络,script表启动虚拟机自动执行网络配置脚本，如果不需要启动，写no即可
    -boot d                 系统启动顺序,d表示表示cdrom
    -nographic              关闭图形输出
    -vnc :0                 开启vnc监听
  
详细的关于`qemu-kvm`的参数使用说明请参考man手册。
  
输入以上命令之后，通过VNC客户端连接按照正常的安装流程安装系统即可。默认VNC端口从5900开始。

## 桥接网络
  
如果虚拟机需要和外界通信，则需要创建桥接网络，之前介绍`qemu-kvm`安装时提到`-net tap,script=no`选项，默认只是创建桥接虚拟网络，并没有启用，只有启用了才可以设置对应网络配置和外界通信。

### 手动桥接

``` bash
# ip link show dev tap0  		//使用如上方式默认创建虚拟网卡tap0，状态为DOWN
37: tap0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN qlen 500
    link/ether d2:b0:af:7b:23:0f brd ff:ff:ff:ff:ff:ff
# brctl show br0				//查看桥接列表，没有tap0
bridge name   bridge id       STP enabled interfaces
br0       8000.b8975a626020   no      eth0
```
  
通过以下方式桥接网络

``` bash
# ip link set tap0 up        	//使tap0状态变为up
# brctl addif br0 tap0        	//桥接tap0到br0
# brctl show br0          		//显示tap0已经加入到桥接列表
bridge name   bridge id       STP enabled interfaces
br0       8000.b8975a626020   no      eth0
                          		     tap0
```
  
如此，配置好虚拟机的网络就可以和外界通信了。
  
`brctl delif br0 tap0`删除桥接网络，`qemu-kvm`工具在客户机关闭时会自动解除TAP设备的bridge绑定，所以这一步无需操作。

### 脚本实现
  
如果不想每次都手动操作，则可以通过脚本自动化实现虚拟网卡的桥接。使用选项`-net tap,script=/tmp/qemu-ifup.sh` 把之前的no替换为需要执行的脚本，以下为`qemu-ifup.sh`脚本内容

``` bash
# cat /tmp/qemu-ifup.sh 
#!/bin/bash

# 桥接网络设备
switch=br0				    //设置桥接网卡

if [ -n $1 ]; then          //$1为qemu-kvm传递值，这里是tap
    ip link set $1 up
    brctl addif ${switch} $1
    exit 0
else
   echo "no interface!"
   exit 1
fi
```

## 系统相关优化
  
完成系统安装配置之后，需要对镜像模板系统做如下一系列优化操作：

### selinux、iptables、服务、文件描述符设置

\# 关闭SELINUX
  
    sed -i -c 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux

\# iptables根据相关需求配置，一般关闭iptables服务

\# 关闭系统其它额外的服务
  
``` bash
service=`chkconfig --list | grep '3:on' | awk '{print $1}'`
for i in $service
do
	case $i in
		acpid | crond | irqbalance |  messagebus | network | sshd | rsyslog | udev-post)
			chkconfig --level 2345 $i on
		;;
		*)
			chkconfig --level 2345 $i off	
		;;
	esac	
done
```

\# 文件描述符相关配置
  
``` bash
cat >>/etc/security/limits.conf <<EOF
*               soft    nofile          65535
*               hard    nofile          65535
EOF
sed -i '/1024/s/1024/65535/' /etc/security/limits.d/90-nproc.conf
```

> __注：__ 经测试acpid服务必须安装且在虚拟机系统中开启，否则OpenNebula web端和shell终端发送关机命令无效。
