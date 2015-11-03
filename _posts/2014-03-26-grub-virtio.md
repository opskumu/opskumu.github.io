---
layout: post
title: "grub with kvm virtio disk"
categories: virtualization
tags: [Linux, kvm]
---


grub-install ERROR: not suitable driver was found

## 一、First

``` bash
grub-install /dev/vda
```

## 二、Second

``` bash
# grub
> device (hd0) /dev/vda
> root (hd0,0)
> setup (hd0)
> quit
```

## 三、`/boot/grub/device.map`

``` bash
(hd0) /dev/vda
```

--EOF--
