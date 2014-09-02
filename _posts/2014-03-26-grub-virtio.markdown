---
layout: post
title: "grub install with kvm virtio disk"
date: 2014-03-26 14:31
comments: true
categories: 虚拟化
keywords: virtio, grub
---


grub-install ERROR: not suitable driver was found


* First
``` bash
grub-install /dev/vda
```

* Second
``` bash
# grub
> device (hd0) /dev/vda
> root (hd0,0)
> setup (hd0)
> quit
```

* `/boot/grub/device.map`
``` bash
(hd0) /dev/vda
```
