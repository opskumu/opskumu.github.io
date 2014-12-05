---
layout: post
title: "golang 位运算"
description: "golang Bitwise"
category: 读书笔记
tags: [Go语言程序设计, go]
---
{% include JB/setup %}

> 位操作是程序设计中对位模式按位或二进制数的一元和二元操作. 在许多古老的微处理器上, 位运算比加减运算略快, 通常位运算比乘除法运算要快很多. 在现代架构中, 情况并非如此:位运算的运算速度通常与加法运算相同(仍然快于乘法运算). [位操作符](http://zh.wikipedia.org/zh/%E4%BD%8D%E6%93%8D%E4%BD%9C)

## 简介

关于位运算的操作，维基百科关于 [位操作符](http://zh.wikipedia.org/zh/%E4%BD%8D%E6%93%8D%E4%BD%9C) 的理论介绍已经非常清楚了。关于 Golang 的位运算其实和 C 语言比较类似，除了取反的操作和 C 语言有点区别，Golang 使用的是`^x`，而 C 使用的则是 `~x`取反。

## 概念

*  `<<`   [ 左移 ]
    * 1 << 2 == 4
    *  输出 0100 ，相比右移更常见，移位后空缺的部分全部填0
*  `>>`    [ 右移 ]
    * 10 >> 2 == 2
    *  输出 0010
*  `x ^ y` [ 异或 ]
    * 10 ^ 2 == 8
    *  操作的结果是如果某位不同则该位为1, 否则该位为0
*  `x | y` [ 或   ]
    * 10 | 2 == 10
    *  两个相应的二进位中只要有一个为1, 该位的结果值为1
*  `x & y` [ 与   ]
    * 10 & 2 == 2
    *  两个相应的二进位都为1, 该位的结果值才为1,否则为0
*  `^x`    [ 取反 ]
    * ^2 == -3
    * 减1取反 [补码](http://baike.baidu.com/view/377340.htm?fr=aladdin)

## 参考

* [位操作符](http://zh.wikipedia.org/zh/%E4%BD%8D%E6%93%8D%E4%BD%9C)
* [golang 位运算详解](http://www.wokugame.com/article/533d4ec21fc9010586000003.html)
