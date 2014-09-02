---
layout: post
title: "30 Handy Bash Shell Aliases[译]"
date: 2013-09-25 10:42
comments: true
categories: UNIX/Linux
keywords: aliases, shell
---

本文为 [原文地址](http://www.cyberciti.biz/tips/bash-aliases-mac-centos-linux-unix.html) 翻译而来，有些地方稍作改动。

一个别名就是一个命令的快捷方式，`alias`命令允许用户通过输入一个词启动任何命令或一组命令(包括选项和文件名)。通过`alias`命令可以显示所有已定义的别名列表。你可以在`~ /.bashrc`文件中自定义用户的别名。通过这些别名可以减少打字时间，更灵活的操作，提升工作效率。


### Task：列出系统别名列表

输入以下命令：

``` bash
alias
```

输出实例:

``` bash
alias cp='cp -i'
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
alias ls='ls --color=auto'
...
```

默认`alias`命令不添加任何选项输出当前用户定义的别名。

### Task：定义/创建一个别名(bash语法)

创建别名使用如下语法：

``` bash
alias name=value
alias name='command'
alias name='command arg1 arg2'
alias name='/path/to/script'
alias name='/path/to/script.pl arg1'
```

在以下的实例中，创建一个`clear`清屏命令的别名c，输入如下命令：

``` bash
alias c=clear
```

输入以上命令之后，如果需要清屏，只需直接输入简单的`c`来代替`clear`命令即可实现

### Task：暂时禁用别名

显示别名`cp`
``` bash
$ alias cp
alias cp='cp -i'
```
`cp`命令是`cp -i`的别名，`-i`选项一定程度上能起到保护作用，但是当我们只想使用原始的cp命令的时候，我们肯定不能简单的输入`cp`命令，这里有两种方式实现

* 使用全名
* 或者使用\\+命令

``` bash
$ ls a b
a  b
$ cp b a		#使用别名之后的cp在覆盖文件时会提示
cp: overwrite `a'? y
$ /bin/cp b a	#使用全称不会有提示
$ \cp b a		#使用\cp不会有提示
```

### 移除alias (bash语法)

你需要使用`unalias`命令移除别名，语法如下：

``` bash
unalias aliasname
```

例如，移除之前`clear`的别名`c`：

``` bash
unalias c
```

如果你在`~/bashrc`文件中定义了别名，也需要从该文件中移除对应所在行。

### Task：定义永久别名

alias c只能在当前会话中生效。当你重启或者退出当前会话的时候，就失效了。为了避免这种问题，田间别名到你的`~/.bashrc`配置文件中，输入:

``` bash
vi ~/.bashrc
```

通过添加如下内容，对于当前用户别名c永久生效：

``` bash
alias c='clear'
```

保存并退出这个文件，全局别名可以存放在`/etc/bashrc`文件中，请注意这个别名命令建立在各种shell中，包括ksh、csh、bash等等

### 一个关于权限访问的小贴士

你可以添加如下代码到`~/.bashrc`：

``` bash
# if user is not root, pass all commands via sudo #
if [ $UID -ne 0 ]; then
    alias reboot='sudo reboot'
    alias update='sudo yum update'
fi
```

### 按照操作系统添加别名的小贴士

你可以添加如下代码到`~/.bashrc` [case语句](http://bash.cyberciti.biz/guide/The_case_statement)：

``` bash
### Get os name via uname ###
_myos="$(uname)"
 
### add alias as per os using $_myos ###
case $_myos in
   Linux) alias foo='/path/to/linux/bin/foo';;
   FreeBSD|OpenBSD) alias foo='/path/to/bsd/bin/foo' ;;
   SunOS) alias foo='/path/to/sunos/bin/foo' ;;
   *) ;;
esac
```

### 30个有用的别名

你可以定义不同类型的别名来节约时间和提升效率。

#### \#1: 控制`ls`命令输出

给`ls`命令的输出来电颜色看看

``` bash
## Colorize the ls output ##
alias ls='ls --color=auto'
 
## Use a long listing format ##
alias ll='ls -la'
 
## Show hidden files ##
alias l.='ls -d .* --color=auto'
```

#### \#2: 调整`cd`命令习惯

``` bash
## get rid of command not found ##
alias cd..='cd ..'
 
## a quick way to get out of current directory ##
alias ..='cd ..'
alias ...='cd ../../../'
alias ....='cd ../../../../'
alias .....='cd ../../../../'
alias .4='cd ../../../../'
alias .5='cd ../../../../..'
```

#### \#3：控制`grep`命令输出

``` bash
## Colorize the grep command output for ease of use (good for log files)##
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
```

#### \#4：开启计算器小数点计算

``` bash
alias bc='bc -l'
```

#### \#5：生成sha1摘要

``` bash
alias sha1='openssl sha1'
```

#### \#6、根据需要创建父目录

``` bash
alias mkdir='mkdir -pv'
```


#### \#7：有颜色的diff输出

``` bash
# install  colordiff package :) 前提需要安装colordiff包
alias diff='colordiff'
```

#### \#8：使mount命令输出格式更漂亮以及可读性更高

``` bash
alias mount='mount |column -t'
```

#### \#9：短命令节省时间

``` bash
# handy short cuts #
alias h='history'
alias j='jobs -l'
```

#### \#10：创建一些新的命令

``` bash
alias path='echo -e ${PATH//:/\\n}'
alias now='date +"%T'
alias nowtime=now
alias nowdate='date +"%d-%m-%Y"'
```

#### \#11：设置默认的vim

``` bash
alias vi=vim
alias svi='sudo vi'
alias vis='vim "+set si"'
alias edit='vim'
```

#### \#12：ping的相关设置

``` bash
# Stop after sending count ECHO_REQUEST packets #
alias ping='ping -c 5'
# Do not wait interval 1 second, go fast #
alias fastping='ping -c 100 -s.2'
```

#### \#13：显示打开的端口

``` bash
alias ports='netstat -tulanp'
```

#### \#14：唤醒沉睡的服务

[Wake-on-LAN(WOL)](http://www.cyberciti.biz/tips/linux-send-wake-on-lan-wol-magic-packets.html)是一个以太网网络标准,允许通过一个网络信息打开服务。您可以使用以下的别名快速唤醒NAS设备和服务器[Devices Using Linux or Unix Computer](http://bash.cyberciti.biz/misc-shell/simple-shell-script-to-wake-up-nas-devices-computers/):

``` bash
## replace mac with your actual server mac address #
alias wakeupnas01='/usr/bin/wakeonlan 00:11:32:11:15:FC'
alias wakeupnas02='/usr/bin/wakeonlan 00:11:32:11:15:FD'
alias wakeupnas03='/usr/bin/wakeonlan 00:11:32:11:15:FE'
```

#### \#15：控制防火墙(iptables)输出

``` bash
## shortcut  for iptables and pass it via sudo#
alias ipt='sudo /sbin/iptables'
 
# display all rules #
alias iptlist='sudo /sbin/iptables -L -n -v --line-numbers'
alias iptlistin='sudo /sbin/iptables -L INPUT -n -v --line-numbers'
alias iptlistout='sudo /sbin/iptables -L OUTPUT -n -v --line-numbers'
alias iptlistfw='sudo /sbin/iptables -L FORWARD -n -v --line-numbers'
alias firewall=iptlist
```

#### \#16：通过curl调试web服务或者CDN问题

``` bash
# get web server headers #
alias header='curl -I'
 
# find out if remote server supports gzip / mod_deflate or not #
alias headerc='curl -I --compress'
```

#### \#17：一些安全的设置

``` bash
# do not delete / or prompt if deleting more than 3 files at a time #
alias rm='rm -I --preserve-root'
 
# confirmation #
alias mv='mv -i'
alias cp='cp -i'
alias ln='ln -i'
 
# Parenting changing perms on / #
alias chown='chown --preserve-root'
alias chmod='chmod --preserve-root'
alias chgrp='chgrp --preserve-root'
```

#### \#18：升级RHEL/CentOS/Fedora Linux 服务

``` bash
## distrp specifc RHEL/CentOS ##
alias update='yum update'
alias updatey='yum -y update'
```

#### \#19：调节sudo和su

``` bash
# become root #
alias root='sudo -i'
alias su='sudo -i'
```

#### \#20：通过sudo关机或重启

``` bash
# reboot / halt / poweroff
alias reboot='sudo /sbin/reboot'
alias poweroff='sudo /sbin/poweroff'
alias halt='sudo /sbin/halt'
alias shutdown='sudo /sbin/shutdown'
```

#### \#21：控制web服务

``` bash
# also pass it via sudo so whoever is admin can reload it without calling you #
alias nginxreload='sudo /usr/local/nginx/sbin/nginx -s reload'
alias nginxtest='sudo /usr/local/nginx/sbin/nginx -t'
alias lightyload='sudo /etc/init.d/lighttpd reload'
alias lightytest='sudo /usr/sbin/lighttpd -f /etc/lighttpd/lighttpd.conf -t'
alias httpdreload='sudo /usr/sbin/apachectl -k graceful'
alias httpdtest='sudo /usr/sbin/apachectl -t && /usr/sbin/apachectl -t -D DUMP_VHOSTS'
```

#### \#22：给备份做别名

``` bash
# if cron fails or if you want backup on demand just run these commands # 
# again pass it via sudo so whoever is in admin group can start the job #
# Backup scripts #
alias backup='sudo /home/scripts/admin/scripts/backup/wrapper.backup.sh --type local --taget /raid1/backups'
alias nasbackup='sudo /home/scripts/admin/scripts/backup/wrapper.backup.sh --type nas --target nas01'
alias s3backup='sudo /home/scripts/admin/scripts/backup/wrapper.backup.sh --type nas --target nas01 --auth /home/scripts/admin/.authdata/amazon.keys'
alias rsnapshothourly='sudo /home/scripts/admin/scripts/backup/wrapper.rsnapshot.sh --type remote --target nas03 --auth /home/scripts/admin/.authdata/ssh.keys --config /home/scripts/admin/scripts/backup/config/adsl.conf'
alias rsnapshotdaily='sudo  /home/scripts/admin/scripts/backup/wrapper.rsnapshot.sh --type remote --target nas03 --auth /home/scripts/admin/.authdata/ssh.keys  --config /home/scripts/admin/scripts/backup/config/adsl.conf'
alias rsnapshotweekly='sudo /home/scripts/admin/scripts/backup/wrapper.rsnapshot.sh --type remote --target nas03 --auth /home/scripts/admin/.authdata/ssh.keys  --config /home/scripts/admin/scripts/backup/config/adsl.conf'
alias rsnapshotmonthly='sudo /home/scripts/admin/scripts/backup/wrapper.rsnapshot.sh --type remote --target nas03 --auth /home/scripts/admin/.authdata/ssh.keys  --config /home/scripts/admin/scripts/backup/config/adsl.conf'
alias amazonbackup=s3backup
```

#### \#23：系统管理员设置端口相关的命令

``` bash
## All of our servers eth1 is connected to the Internets via vlan / router etc  ##
alias dnstop='dnstop -l 5  eth1'
alias vnstat='vnstat -i eth1'
alias iftop='iftop -i eth1'
alias tcpdump='tcpdump -i eth1'
alias ethtool='ethtool eth1'
 
# work on wlan0 by default #
# Only useful for laptop as all servers are without wireless interface
alias iwconfig='iwconfig wlan0'
```

#### \#24：快速获取系统内存、cpu使用以及gpu内存信息

``` bash
## pass options to free ## 
alias meminfo='free -m -l -t'
 
## get top process eating memory
alias psmem='ps auxf | sort -nr -k 4'
alias psmem10='ps auxf | sort -nr -k 4 | head -10'
 
## get top process eating cpu ##
alias pscpu='ps auxf | sort -nr -k 3'
alias pscpu10='ps auxf | sort -nr -k 3 | head -10'
 
## Get server cpu info ##
alias cpuinfo='lscpu'
 
## older system use /proc/cpuinfo ##
##alias cpuinfo='less /proc/cpuinfo' ##
 
## get GPU ram on desktop / laptop## 
alias gpumeminfo='grep -i --color memory /var/log/Xorg.0.log'
```

#### \#25：控制家庭路由器

``` bash
# Reboot my home Linksys WAG160N / WAG54 / WAG320 / WAG120N Router / Gateway from *nix.
alias rebootlinksys="curl -u 'admin:my-super-password' 'http://192.168.1.2/setup.cgi?todo=reboot'"
 
# Reboot tomato based Asus NT16 wireless bridge 
alias reboottomato="ssh admin@192.168.1.1 /sbin/reboot"
```

#### \#26：wget续传

``` bash
## this one saved by butt so many times ##
alias wget='wget -c'
```

#### \#27：使用不同的浏览器测试网页

``` bash
## this one saved by butt so many times ##
alias ff4='/opt/firefox4/firefox'
alias ff13='/opt/firefox13/firefox'
alias chrome='/opt/google/chrome/chrome'
alias opera='/opt/opera/opera'
 
#default ff 
alias ff=ff13
 
#my default browser 
alias browser=chrome
```

#### \#28：ssh小贴士

不创建别名，通过使用OpenSSH配置文件`~/.ssh/config`配置，它提供了很多选项，如：

``` bash
Host server10
  Hostname 1.2.3.4
  IdentityFile ~/backups/.ssh/id_dsa
  user foobar
  Port 30000
  ForwardX11Trusted yes
  TCPKeepAlive yes
```

现在可以通过如下命令连接

``` bash
$ ssh server10
```

#### \#29：现在轮到你分享了

``` bash
## set some other defaults ##
alias df='df -H'
alias du='du -ch'
 
# top is atop, just like vi is vim
alias top='atop'
 
## nfsrestart  - must be root  ##
## refresh nfs mount / cache etc for Apache ##
alias nfsrestart='sync && sleep 2 && /etc/init.d/httpd stop && umount netapp2:/exports/http && sleep 2 && mount -o rw,sync,rsize=32768,wsize=32768,intr,hard,proto=tcp,fsc natapp2:/exports /http/var/www/html &&  /etc/init.d/httpd start'
 
## Memcached server status  ##
alias mcdstats='/usr/bin/memcached-tool 10.10.27.11:11211 stats'
alias mcdshow='/usr/bin/memcached-tool 10.10.27.11:11211 display'
 
## quickly flush out memcached server ##
alias flushmcd='echo "flush_all" | nc 10.10.27.11 11211'
 
## Remove assets quickly from Akamai / Amazon cdn ##
alias cdndel='/home/scripts/admin/cdn/purge_cdn_cache --profile akamai'
alias amzcdndel='/home/scripts/admin/cdn/purge_cdn_cache --profile amazon'
 
## supply list of urls via file or stdin
alias cdnmdel='/home/scripts/admin/cdn/purge_cdn_cache --profile akamai --stdin'
alias amzcdnmdel='/home/scripts/admin/cdn/purge_cdn_cache --profile amazon --stdin'
```

#### \#30：The End Is the Beginning 

... ...
