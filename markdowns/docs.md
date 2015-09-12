# Template/模板写法

## Lite Version/原生写法

```
<h1><%= title %></h1>
<ul>
  <%each(list, function(value, index) {%>
    <li><%= index %>: <%= @value %></li>
  <%})%>
</ul>
```

## Syntax Version/简洁写法

```
<h1>{{@title}}</h1>
<ul>
  {{each list as value, index}}
    <li>{{@index}}: {{@value}}</li>
  {{/each}}
</ul>
```


# Function/方法

## Basic/基础方法

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

helper 同时可以作为获取辅助函数的方法来使用，当没有传入 helper 的时候就会返回该辅助函数，但该函数必须是存在的。

```
oTemplate.helper([String name], [Function helper])

name    {String}    辅助函数名称
helper  {Function}  辅助函数 (optional)
return  {Self|Function}
```

[DEMO]()


### unhelper/注销辅助函数

```
oTemplate.unhelper([String name])

name    {String} 辅助函数的名称
return  {Self}
```

[DEMO]()


### block/注册块级辅助函数 (语法版本下才有用)

- block 块级辅助函数只在自定义语法下有显著功效，在原生语法版本(`lit`)下没有任何意义，
因此该方法只在语法版本上使用。
- block 同时可以作为获取辅助函数的方法来使用，当没有传入 block 的时候就会返回该辅助函数，但该函数必须是存在的。

```
oTemplate.block([String name], [Function helper])

name    {String}    辅助函数名称
helper  {Function}  辅助函数
return  {Self}
```

[DEMO]()


### unblock/注销块级辅助函数 (语法版本下才有用)

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

```

- `syntax` 与 `shell` 参数为字符串时，`'(\\\w+)'` 将会编译成 `/{{\\\w+}}/igm`，但是这个正则是贪婪匹配，这样会造成很多匹配错误，我们必须将其改成 `'(\\\w+)?'`，例如匹配 `'{{aaa}}{{aaa}}'` 的时候，贪婪匹配会将整个字符串匹配完成，而不是 `'{{aaa}}'`。
- `syntax` 与 `shell` 参数为字符串时可以使用 '<%= openTag %>' 的方式来获取模板引擎的配置属性。


```
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


### $clearSyntax/清除语法 (语法版本才能使用)

```
oTemplate.$clearSyntax([String source])

source {String} 模板资源
```


## 扩展引擎

### extends/扩展

- callback 的 scope 也是 oTemplate 自身
- 若模板引擎本身还没初始化，可以定义 `oTemplate._extends` 来配置默认初始化，一般只会内部使用。

```
oTemplate.extends([Function callback])

callback {Function}     回调函数
  oTemplate {OTemplate} 模板引擎自身
```

[DEMO](https://github.com/DavidKk/oTemplate/blob/master/syntax/default.js)


## 高级扩展

### $compileSyntax/语法接口

该方法在 lite 版本上并没有定义，因此我们可以通过扩展 `$compileSyntax` 来实现相应的语法模块，
只要将语法段替换成原生语法并用 `<%%>` 将逻辑包裹起来就可以实现自定义定义语法模块。

同时，必须开启语法配置
```
OTemplate._defaults = extend(OTemplate._defaults, {
  noSyntax: false
})
```

[DEMO](https://github.com/DavidKk/oTemplate/blob/master/src/syntax.js)
