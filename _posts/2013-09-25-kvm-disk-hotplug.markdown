---
layout: post
title: "OpenNebula KVM磁盘热插拔"
date: 2013-09-25 15:22
comments: true
categories: 虚拟化
keywords: OpenNebula, hotplug
---

KVM支持以下两种磁盘类型的热插拔：

* sd: SCSI (default).
* vd: virtio.

KVM虚拟机需要开启acpi才支持磁盘的热插拔，使用OpenNebula安装虚拟机的时候需要设置如下选项：

* FEATURES = [ acpi="yes" ] 


### virtio磁盘热插拔

虚拟机加载acpiphp驱动

``` bash
# modprobe acpiphp	# 加载驱动
# fdisk -l

Disk /dev/vda: 32.2 GB, 32212254720 bytes
255 heads, 63 sectors/track, 3916 cylinders
Units = cylinders of 16065 * 512 = 8225280 bytes

   Device Boot      Start         End      Blocks   Id  System
/dev/vda1   *           1          13      104391   83  Linux
/dev/vda2              14        3916    31350847+  8e  Linux LVM
```

选择需要添加磁盘的虚拟机- [ Disks & Hotplugging ] ，配置完成之后选择 Attach 挂载使用

<center><img src="/images/OpenNebula/OpenNebula_disk1.jpg" width="500"></center>

 
Device Prefix选择sd表示scsi磁盘，如果是vd则是vitio类型磁盘。选择Attach之后，刷新页面就会看到新建的磁盘。

<center><img src="/images/OpenNebula/OpenNebula_disk2.jpg" width="500"></center>

此时查看vda磁盘是否生效
``` bash
# fdisk -l			# 查看磁盘识别

...

Disk /dev/vdb: 1048 MB, 1048576000 bytes
16 heads, 63 sectors/track, 2031 cylinders
Units = cylinders of 1008 * 512 = 516096 bytes

Disk /dev/vdb doesn't contain a valid partition table
```

### scsi磁盘热插拔

虚拟机加载acpiphp驱动

``` bash
# modprobe acpiphp	# 加载驱动
```

选择需要添加磁盘的虚拟机- [ Disks & Hotplugging ] ，配置完成之后选择 Attach挂载使用
 
<center><img src="/images/OpenNebula/OpenNebula_disk3.jpg" width="500"></center>

如下即可看到新添加的磁盘
``` bash
# fdisk -l

...

Disk /dev/sda: 1048 MB, 1048576000 bytes
33 heads, 61 sectors/track, 1017 cylinders
Units = cylinders of 2013 * 512 = 1030656 bytes

Disk /dev/sda doesn't contain a valid partition table
```

如果未识别scsi磁盘，执行如下命令，使得KVM虚拟机识别
``` bash
# echo '- - -' > /sys/class/scsi_host/host0/scan
# fdisk -l
...
Disk /dev/sdb: 1048 MB, 1048576000 bytes
33 heads, 61 sectors/track, 1017 cylinders
Units = cylinders of 2013 * 512 = 1030656 bytes

Disk /dev/sdb doesn't contain a valid partition table
```

### 参考文档

* [KVM Driver 4.2](http://opennebula.org/documentation:rel4.2:kvmg)
* [Adding Virtio block devices at runtime in Libvirt KVM](http://serverfault.com/questions/453456/adding-virtio-block-devices-at-runtime-in-libvirt-kvm)

--EOF--
