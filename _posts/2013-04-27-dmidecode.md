---
layout: post
title: "dmidecode 硬件信息查看"
categories: linux
tags: [Linux, cmd]
---

在介绍dmidecode命令之前，先介绍一下DMI。所谓DMI，即DesktopManagement Interface。也有被称为SMBIOS，即System Management BIOS。DMI表的意义在于让我们在不探测硬件实体的情况下获取硬件的部分信息，方便了用户，但也同时表明，表中的信息可能是不可靠的。

`dmidecode`的作用则是将DMI表中的信息用人可以读懂的方式显示出来。

最简单的使用方法，它将显示dmidecode所能获取到的全部dmi信息：

``` bash
# dmidecode
```

但是显示所有的信息不便于我们获取想要获取的信息，那么就需要结合其它选项获取信息

## 一、常用参数

* -q 或 --quiet
	* 不显示太多信息，比如某条数据是从哪里读来的等等，为了得到简洁的信息，此条很有用
* -t 或 --type TYPE
	* 指定要显示类型的信息
* -s 或 --string KEYWORD
	* 显示特定的关键字


### 1.1 -t或--type后的文本参数

	bios 		bios的各项信息
	system 		系统信息，在我的笔记本上可以看到版本、型号、序号等信息。
	baseboard 	主板信息
	chassis 	底板信息
	processor 	CPU的详细信息
	memory 		内存信息，包括目前插的内存条数及大小，支持的单条最大内存和总内存大小等
	cache 		缓存信息
	connector 	PCI设备信息
	slot 		插槽信息

``` bash
# dmidecode -t
dmidecode: option requires an argument -- 't'
Type number or keyword expected
Valid type keywords are:
  bios
  system
  baseboard
  chassis
  processor
  memory
  cache
  connector
  slot
```

### 1.2 dmidecode -s

``` bash
# dmidecode -s
dmidecode: option requires an argument -- 's'
String keyword expected
Valid string keywords are:
  bios-vendor
  bios-version
  bios-release-date
  system-manufacturer
  system-product-name
  system-version
  system-serial-number
  system-uuid
  baseboard-manufacturer
  baseboard-product-name
  baseboard-version
  baseboard-serial-number
  baseboard-asset-tag
  chassis-manufacturer
  chassis-type
  chassis-version
  chassis-serial-number
  chassis-asset-tag
  processor-family
  processor-manufacturer
  processor-version
  processor-frequency
```

## 二、常用命令举例

* 1、查看服务器型号：`dmidecode | grep 'Product Name'`
* 2、查看系统序列号：`dmidecode -s system-serial-number`
* 3、查看内存信息：`dmidecode -t memory`
* 4、查看OEM信息：`dmidecode -t 11`

--EOF--
