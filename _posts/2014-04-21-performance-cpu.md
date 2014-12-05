---
layout: post
title: "cpu 性能指标"
categories: UNIX/Linux
tags: [Linux, cmd]
---
{% include JB/setup %}

Linux性能相关可以从以下几方面入手： 

* CPU
* Memory
* IO
* Network


这些子系统之间关系相互彼此依赖的，任何一个高负载都会导致其他子系统出现问题，比如：

* 大量的页请求导致内存队列的拥塞
* 网卡的大吞吐量可能导致更多的CPU开销
* 大量的CPU开销又尝试更多的内存使用请求
* 大量来自内存的磁盘写请求可能导致更多的cpu以及IO问题

# CPU

主要关注点在运行队列、利用率、上下文切换

* Run Queues - 每个处理器应该运行队列不超过1-3个线程，一个双核处理器应该运行队列不要超过6个线程
* CPU Utiliation - 如果一个CPU被充分使用，利用率分类之间均衡的比例应该是：
    * 65% - 70% User Time
    * 30% - 35% System Time
    * 0% - %5 Idle Time
* Context Switches - 上下文切换的数目直接关系到CPU的使用率，如果CPU利用率保持在上述均衡状态时，大量的上下文切换是正常的


``` bash
$ vmstat 2
procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu------
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 4  0  42808 130596  70836 23084420    0    0     0     5    0    0  5  2 93  0  0
 8  0  42808 129388  70836 23084904    0    0     0    30 10987 80554  9  3 88  0  0
 6  0  42808 137428  70828 23076148    0    0     0    26 11129 80587  9  3 88  0  0
```

* `r` The amount of threads in the run queue. These are threads that are runnable, but the CPU is not available to execute them.
    * 当前`运行队列中线程的数目`.代表线程处于可运行状态,但CPU还未能执行.
* `b` This is the number of processes blocked and waiting on IO requests to finish.
    * 当前`进程阻塞并等待IO请求完成的数目`
* `in` This is the number of interrupts being processed.
    * 当前`中断`被处理的数目
* `cs` This is the number of context switches currently happening on the system.
    * 当前kernel system中,发生`上下文切换`的数目
* `us` This is the percentage of user CPU utilization.
    * CPU利用率的百分比
* `sys` This is the percentage of kernel and interrupts utilization.
    * `内核和中断利用率的百分比`
* `wa` This is the percentage of idle processor time due to the fact that ALL runnable threads are blocked waiting on IO.
    * 所有`可运行状态线程被阻塞在等待IO请求的百分比`
* `id` This is the percentage of time that the CPU is completely idle.
    * CPU空闲时间的百分比

``` bash
$ mpstat -P ALL 1   # 查看单个cpu利用率情况，同`sar -P ALL 1`
16时17分05秒  CPU   %user   %nice    %sys %iowait    %irq   %soft  %steal   %idle    intr/s
16时17分07秒  all    2.62    0.00    0.29    0.10    0.04    0.33    0.00   96.61  11159.00
16时17分07秒    0    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00   1000.50
16时17分07秒    1    0.00    0.00    0.00    1.01    0.00    0.00    0.00   98.99     26.00
16时17分07秒    2    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00      0.00
16时17分07秒    3    0.50    0.00    0.00    0.00    0.00    0.00    0.00   99.50      0.00
16时17分07秒    4    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00      0.00
16时17分07秒    5    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00      0.00
```

``` bash
$ while :; do ps -eo pid,ni,pri,pcpu,psr,comm | \
grep 'mysqld'; sleep 1 ;done # ps通过查看psr队列获取进程占用哪个cpu
```

top也可以实时查看占用哪个cpu

``` bash
$ top -p `pgrep mysql | xargs | tr " " ","` # 执行如上命令之后输入`f`,然后输入`j`回车即可
```

`pri`优先级动态值，`ni`为静态值，root用户可以调高nice优先级[-20~19]，-20为优先级最高，普通用户只能调低优先级，两者关系：`pri[new]=pri[old]+nice`

监控CPU性能由以下几个部分组成：

*   1、检查system的运行队列，以及确定不要超过每个处理器3个可运行状态线程的限制
*   2、确定CPU利用率中user/system比例维持在70/30
*   3、当CPU开销更多的时间在system mode，那就说明已经超负荷并且应该尝试重新调度优先级
*   4、当I/O处理增长，CPU相应的应用将会受到影响

--EOF--
