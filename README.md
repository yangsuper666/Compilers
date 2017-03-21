# Compilers

## 项目说明
编译原理课程设计，要求完成词法和语法分析，采用JavaScript编写，ES6接触不久，写的比较挫，欢迎吐槽

编程语言: ES6 (其实是大杂烩)

运行环境: nodejs v6.10.0

运行说明:

1. 执行```git clone https://github.com/yangsuper666/Compilers.git```克隆项目
2. 进入项目后执行  ``` npm install ```安装包主要为express和colors(编写代码时方便显示信息)

## 文件说明

现在主要包括四个文件 ```lex.js``` ```lex_parser.js``` ```syntax.js``` ```syntax_parser.js``` 现在写到了生成项目族，后期完成action表和goto表的构建，并完成语义分析。

## 词法分析说明

当初以为第四周就答辩，所以选择简单的正规文法到DFA的转换。

## 语法分析说明

(完成action和goto表后编写)

## 代码说明

 ```lex.js```说明

```javascript
 this.transNFA = function(grammer, endName){}  // 将正规文法转换成NFA
 this.transDFA = function(){}                  // 将NFA转换成DFA
 hashSet = function(dataSet){}            // js没有像py的hash函数，所以手写一个生成唯一id
 moveTo = function(vt, State, nfa){}      // moveTo 
 this.getToken = function(input, row){}        // 获得token
```

```syntax.js```说明

```javascript
this.firstSet = {}      // first集
this.exp = []           // 记录文法产生式
// 一个项目
let src = { 
    index : 0,            // 文法产生式id
    pos : 0,              // 圆点位置
    fro : new Set(['#']), // first(βa)
    length : 1,           // 文法产生式长度
    hash : hash           // 项目hash值
};
// 项目集族
this.projectSet = [{
 	id: 0,
	set: [{index: 0, pos: 0, fro: Set(), length: 1, hash: "0&0&([#])&1"}, ...], // 存储项目
	next: { L: [ 1 ], *: [ 2 ]}  // 存储状态转换后next的id
},...]
```

```javascript
this.readSyn = function(grammer, index){}  // 读取文法
this.getVn_Vt = function(){}               // 获取终结符和非终结符
this.getFirstSet = function(v, all){}      // 递归求出first集合
hashSet = function(item){}                 // 同上
isInPro = function(closure, item){}        // 判断项目集有无相同项目
isInProSet = function(proSet, temp){}      // 判断项目集族中有无相同项目集
getExtend = function(exp, first, node){}   // 求出first(βa)
getClosure = function(item, par){}         // 求出项目集闭包
this.getSyntaxDFA = function(){}           // 构造项目集族
```

#### look out

代码中引用了express包，所以可以把编译中产生的中间数据以json的形式返回到浏览器查看，方便调试，建议chrome安装json view 这一插件，可以清晰的查看json数据，后期打算做成web的形式，看看有没有时间吧。