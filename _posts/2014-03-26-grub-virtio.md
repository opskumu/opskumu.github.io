---
layout: post
title: "grub with kvm virtio disk"
categories: 虚拟化
tags: [Linux, kvm]
---
{% include JB/setup %}


grub-install ERROR: not suitable driver was found

# First

``` bash
grub-install /dev/vda
```

# Second

``` bash
# grub
> device (hd0) /dev/vda
> root (hd0,0)
> setup (hd0)
> quit
```

# `/boot/grub/device.map`

``` bash
(hd0) /dev/vda
```

--EOF--