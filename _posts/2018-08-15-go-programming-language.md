---
layout: post
title: The Go Programming Language 摘要
---

本文为阅读 [The Go Programming Language](https://book.douban.com/subject/26337545/) 一书的笔记摘要。

## 二、程序结构

### 命名

* 包名 `小写`
* Go 语言尽量使用短小的名字，特别是局部变量
    * 如果一个名字的作用域比较大，生命周期比较长，则用长的名字会更有意义
* Go 推荐使用 `驼峰式` 命名，当名字有几个单词组成时优先使用 `大小写` 分隔，而非下划线

### 声明

* Go 语言主要有四种类型的声明语句：`var`、`const`、`type`、`func`
* 变量的生命周期指的是在程序运行期间变量有效存在的时间间隔。对于在包一级声明的变量来说，它们的生命周期和整个程序的运行周期是一致的。而相比之下，局部变量的声明周期则是动态的:每次从创建一个新变量的声明语句开始，直到该变量不再被引用为止，然后变量的存储空间可能被回收。函数的参数变量和返回值变量都是局部变量。它们在函数每次被调用的时候创建。

## 三、基础数据类型

* Go 语言将数据类型分为四类:`基础类型`、`复合类型`、`引用类型` 和 `接口类型`

### [字符串](https://blog.golang.org/strings)

> In Go, a string is in effect a read-only slice of bytes.

```
const s = "世界"
fmt.Println(len(s))            // 输出结果为 6 表示字符串 s 占用 6 个字节，一个中文占用 3 个字节
fmt.Println(len([]rune(s)))    // 输出结果为 2 表示字符串 s 转换成 rune 之后占用 2 个 rune 字符码
```

```
const s = "世界"
for i, v := range s {
        fmt.Printf("%#U starts at byte position %d\n", v, i)
}
```

> %#U, which shows the code point's Unicode value and its printed representation.

运行结果

```
U+4E16 '世' starts at byte position 0
U+754C '界' starts at byte position 3
```

* 字符串遍历
    * `for i := 0; i < xx; i++` 这种方式是一个字节一个字节遍历
    * `for i, v := range xx` 这种方式是遍历字符串的 rune

* `rune` （`int32` 类型别名）
* `byte` (`uint8` 类型别名)
* Go 的字符串是 `UTF-8` 编码的，UTF8 编码使用 1 到 4 个 字节来表示每个 Unicode 码点
* 反引号 \`\` 创建原生的字符串字面量，不支持任何转义

## 四、复合数据类型

### 数组

* 因为数组的长度是固定的，因此在 Go 中很少直接使用数组
* 在数组字面值中，如果在数组的长度位置出现的是 `...` 省略号，则表示数组的长度是根据初始化值的个数来计算

```
q := [...]int{1, 2, 3}
```

* 可以指定一个索引和对应值列表的方式初始化数组

```
symbol := [...]string{0: "$", 3: "¥"}    // 数组中指定了第一个和第四个索引值，未指定的自动取空字符串
```

### 切片

* 一个 slice 由三个 部分构成:`指针`、`长度` 和 `容量`。指针指向第一个 slice 元素对应的底层数组元素的地址，要注意的是 slice 的第一个元素并不一定就是数组的第一个元素。长度对应 slice 中元素的数目; 长度不能超过容量，容量一般是从 slice 的开始位置到底层数据的结尾位置。内置的 `len` 和 `cap` 函数分别返回 slice 的长度和容量
* slice 唯一合法的比较操作是和 `nil` 比较

```
package main

import "fmt"

func array(a [4]string) [4]string {
    a[0] = "That"
    return a
}

func slice(s []string) []string {
    s[0] = "That"
    return s
}

func main() {
    a := [4]string{"This", "is", "a", "test"}
    s := []string{"This", "is", "a", "test"}

    array(a)
    slice(s)
    fmt.Println(a) // 作用域问题，此处数组不会改变
    fmt.Println(s) // 因为 slice 中元素本身是指针，所以此处 "This" 会被替换成 "That"
}
```

输出结果：

```
[This is a test]
[That is a test]
```

### Map

* 哈希表是一种巧妙并且实用的数据结构，它是一个 `无序` 的 `key/value` 对的集合，在 Go 中，一个 map 就是一个哈希表的引用
* 禁止对 map 元素取址的原因是 map 可能随着元素数量的增长而重新分配更大的内存空间， 从而可能导致之前的地址无效
* 通过 key 作为索引下标来访问 map 将产生一个 value。如果 key 在 map 中是存在的，那么将得到与 key 对应的 value。如果 key 不存在，那么将得到 value 对应类型的零值

### 结构体

* Go 语言有一个特性让我们只声明一个成员对应的数据类型而不指名成员的名字;这类成员就叫匿名成员。匿名成员的数据类型必须是命名的类型或指向一个命名的类型的指针。

```
type Circle struct {
    Point
    Radius int
}

type Wheel struct {
    Circle
    Spokes int
}
```

得意于匿名嵌入的特性，我们可以直接访问叶子属性而不需要给出完整的路径:

```
var w Wheel w.X = 8
w.Y = 8 w.Radius = 5 w.Spokes = 20
// equivalent to w.Circle.Point.X = 8
// equivalent to w.Circle.Point.Y = 8
// equivalent to w.Circle.Radius = 5
```

* Printf 函数中 `%v` 参数包含的 `#` 副词，它表示用和 Go 语言类似的语法打印值。对于结构体类型来说，将包含每个成员的名字

```
w = Wheel{Circle{Point{8, 8}, 5}, 20}

w = Wheel{
    Circle: Circle{
        Point:  Point{X: 8, Y: 8},
        Radius: 5,
    },
    Spokes: 20, // NOTE: trailing comma necessary here (and at Radius) }
fmt.Printf("%#v\n", w)
// Output:
// Wheel{Circle:Circle{Point:Point{X:8, Y:8}, Radius:5}, Spokes:20}
```

## 五、函数

### 可变函数

* 参数数量可变的函数称为为可变参数函数
* 在声明可变参数函数时，需要在参数列表的 `最后一个参数` 类型之前加上省略符号 `...`，这表示该函数会接收任意数量的该类型参数
    * 如果原始参数已经是切片类型，只需在最后一个参数后加上省略符
* 虽然在可变参数函数内部，`...int` 型参数的行为看起来很像切片类型，但实际上，可变参数函数和以切片作为参数的函数是不同的

```
func f(...int) {}
func g([]int) {}
fmt.Printf("%T\n", f) // "func(...int)"
fmt.Printf("%T\n", g) // "func([]int)"
```

## 六、方法

* 在函数声明时，在其名字之前放上一个变量，即是一个方法。这个附加的参数会将该函数附加到这种类型上，即相当于为这种类型定义了一个独占的方法
* 在 Go 语言中，我们并不会像其它语言那样用 this 或者 self 作为接收器;我们可以任意的选择接收器的名字。由于接收器的名字经常会被使用到，所以保持其在方法间传递时的一致性和简短性是不错的主意。这里的建议是可以使用其类型的第一个字母

### 封装

* 一个对象的变量或者方法如果对调用方是不可见的话，一般就被称为封装。封装有时候也被叫做信息隐藏，同时也是面向对象编程中很关键的一个方面
* Go 语言只有一种控制可见性的手段: `大写首字母` 的标识符会从定义它们的包中被导出，小写字母的则不会。这种限制包内成员的方式同样适用于结构体字段或者一个类型的方法

## 七、接口

* 一个类型如果拥有一个接口需要的所有方法，那么这个类型就实现了这个接口
* 调用 `errors.New` 函数是非常稀少的，因为有一个方便的封装函数 `fmt.Errorf`，它还会处理字符串格式化
* 接口只有当有两个或两个以上的 具体类型必须以相同的方式进行处理时才需要

## 八、Goroutines 和 Channel

* 如果说 goroutine 是 Go 语言程序的并发体的话，那么 channel 则是它们之间的通信机制。一个 channel 是一个通信机制，它可以让一个 goroutine 通过它给另一个 goroutine 发送值信息

使用内置的 make 函数，我们可以创建一个 channel:

```
ch := make(chan int) // ch has type 'chan int'
```

* 当一个 channel 被关闭后，再向该 channel 发送数据将导致 panic 异常。当一个被关闭的 channel 中已经发送的数据都被成功接收后，后续的接收操作将不再阻塞，它们会立即返回一个零值
* 试图重复关闭一个 channel 将导致 panic 异常，试图关闭一个 nil 值的 channel 也将导致 panic 异常
* 内置函数 `cap` 可以获取 channel 内部缓存容量，内置函数 `len` 可以获取内部缓存队列中有效元素的个数
* 关于无缓存或带缓存 channels 之间的选择，或者是带缓存 channels 的容量大小的选择，都可能影响程序的正确性。无缓存 channel 更强地保证了每个发送操作与相应的同步接收操作; 但是对于带缓存 channel，这些操作是解耦的。同样，即使我们知道将要发送到一个 channel 的信息的数量上限，创建一个对应容量大小的带缓存 channel 也是不现实的，因为这要求在执行任何接收操作之前缓存所有已经发送的值。如果未能分配足够的缓冲将导致程序死锁。Channel 的缓存也可能影响程序的性能

## 十、包和工具

* 如果只是导入一个包而并不使用导入的包将会导致一个编译错误。但是有时候我们只是想利 用导入包而产生的副作用:它会计算包级变量的初始化表达式和执行导入包的 init 初始化函数。这时候我们需要抑制 "unused import" 编译错误，我们可以用下划线 `_` 来重命名导入的包。像往常一样，下划线 `_` 为空白标识符，并不能被访问

```
import _ "image/png" // register PNG decoder
```
