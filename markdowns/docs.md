# 模板写法


# 接口

## 基础方法

### compile/编译资源

```
oTemplate.compile([String source], [Object options])

source  {String} 模板资源
options {Object} 渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return  {Function} 渲染器
```

[DEMO]()


### render/渲染资源

```
oTemplate.render([String source], [Object data], [Object options])

source  {String} 模板资源
data    {Object} 渲染的数据
options {Object} 渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return  {String}
```

[DEMO]()


### compileById/通过内联模板编译资源

```
oTemplate.compileById([String elementId], [Object options])

elementId {String} 内联模板的ID
options   {Object} 渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return    {Function} 渲染器
```

[DEMO]()


### renderById/通过内联模板渲染资源

```
oTemplate.renderById([String elementId], [Object options])

elementId {String} 内联模板的ID
data      {Object} 渲染的数据
options   {Object} 渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return    {String}
```

[DEMO]()


### compileByAjax/通过AJAX渲染资源

```
oTemplate.renderByAjax([String filename], [Object options])

filename  {String}   模板文件
options   {Object}   渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return    {Function} 渲染器
```

[DEMO]()


### renderByAjax/通过Ajax渲染资源

```
oTemplate.renderByAjax([String filename], [Object data], [Object options])

filename  {String}   模板文件
data      {Object}   渲染的数据
options   {Object}   渲染配置 (optional)
  noSyntax {Boolean} 是否为没有语法，默认为 false
  strict   {Boolean} 是否为严格模式，若语法出现错误则会返回空字符串，默认为 true
return    {String}
```

[DEMO]()


### helper/注册辅助函数

```
oTemplate.helper([String name], [Function helper])

name    {String}    辅助函数名称
helper  {Function}  辅助函数
return  {Self}
```

[DEMO]()


### unhelper/注销辅助函数

```
oTemplate.unhelper([String name])

name    {String} 辅助函数的名称
return  {Self}
```

[DEMO]()


### block/注册块级辅助函数

block 块级辅助函数只在自定义语法下有显著功效，在原生语法版本(`lit`)下没有任何意义，
因此该方法只在语法版本上使用。

```
oTemplate.block([String name], [Function helper])

name    {String}    辅助函数名称
helper  {Function}  辅助函数
return  {Self}
```

[DEMO]()


### unblock/注销块级辅助函数

```
oTemplate.unblock([String name])

name    {String} 辅助函数的名称
return  {Self}
```

[DEMO]()


### config/设置配置

```
oTemplate.config([Object options])

options {Object} 配置信息

oTemplate.config([String name, Anything value])

name  {String}    配置名称
value {Anything}  配置的值
```

[DEMO]()


## 高级用法

### $registerSyntax/注册语法 (语法版本才能使用)

```
oTemplate.$registerSyntax([String name], [String syntax, RegExp syntax], [String shell, Function shell])

name    {String}          语法名称
syntax  {String|Regexp}   语法匹配
shell   {String|Function} 脚本替换

oTemplate.$registerSyntax([String name], [Object options, Array options])

name    {String}          语法名称
options {Object}          语法配置
  key   {String}          语法匹配
  value {String|Regexp}   脚本替换

name    {String}          语法名称
options {Array}           语法配置
  item  {Object}          语法配置
    syntax  {String|Regexp}   语法匹配
    shell   {String|Function} 脚本替换
```

[DEMO]()


### $unregisterSyntax/注销语法 (语法版本才能使用)

```
oTemplate.$unregisterSyntax([String name])

name {String} 语法名称
```

[DEMO]()

