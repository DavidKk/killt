# Examples

这里就不介绍原生版本如何使用了

## Basic/基本用法

### HTML

```
<script id="/template/basic.html" type="template/text">
  <h1>{{= title}}</h1>
  <ul>
      {{each list as value, index}}
          <li>{{= index}} ：{{= value}}</li>
      {{/each}}
  </ul>
</script>
```

### Javascript

```
killt.renderById('/template/basic.html', {
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

### Output

<iframe data-src="/killt/demo/basic.html"></iframe>



## Compile/编译

### HTML

```
<script id="/template/compile.html" type="template/text">
  <h1>{{= title}}</h1>
  <ul>
      {{each list as value, index}}
          <li>{{= index}} ：{{= value}}</li>
      {{/each}}
  </ul>
</script>
```

### Javascript

```
var render = killt.compileById('/template/compile.html')
render({
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

### Output

<iframe data-src="/killt/demo/compile.html"></iframe>

## Include/引入

### HTML

```
<script id="/template/include.html" type="template/text">
  <h1>{{= title}}</h1>
  {{include "/template/include/a.html", $data}}
</script>

<script id="/template/include/a.html" type="template/text">
  <h3>{{= subTitle}}</h3>
  {{include "/template/include/b.html", $data}}
</script>

<script id="/template/include/b.html" type="template/text">
  <ul>
      {{each list as value, index}}
          <li>{{= index}} ：{{= value}}</li>
      {{/each}}
  </ul>
</script>
```

### Javascript

```
killt.renderById('/template/include.html', {
  title: 'killt',
  subTitle: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

### Output

<iframe data-src="/killt/demo/include.html"></iframe>


## Helper/辅助函数

### HTML

```
<script id="/template/helper.html" type="template/text">
  <h1>{{= title}}</h1>
  <p>{{'Me?' | love}}</p>
  <p>{{'U' | love}}</p>
</script>
```

### Javascript

```
killt.helper('love', function(who) {
  return /\?/.exec(who) ? 'Fuck Q!!!' : 'Love ' + who
})

document.body.innerHTML = killt.renderById('/template/helper.html', {
  title: 'Helper Defination'
})
```

### Output

<iframe data-src="/killt/demo/helper.html"></iframe>


## Noescape/不转义

### HTML

```
<script id="/template/noescape.html" type="template/text">
  <h1>{{= title}}</h1>
  <h4>默认 escape = true</h4>
  <p>{{= noescapeContent}}</p>
  <h4>不转义</h4>
  <p>{{#escapeContent}}</p>
  <h4>强制转义</h4>
  <p>{{!#escapeContent}}</p>
</script>
```

### Javascript

```
killt.renderById('/template/noescape.html', {
  title: 'killt',
  noescapeContent: '<div>\
      Check it out!!!\
      <ul>\
        <li>check</li>\
        <li>check</li>\
        <li>check</li>\
        <li>yoyoyo</li>\
      </ul>\
    </div>',
  escapeContent: '<div>\
      Check it out!!!\
      <ul>\
        <li>check</li>\
        <li>check</li>\
        <li>check</li>\
        <li>yoyoyo</li>\
      </ul>\
    </div>'
}, {
  escape: true
})
```

### Output

<iframe data-src="/killt/demo/noescape.html"></iframe>


## AJAX/异步请求模板

### HTML

```
<!-- /templates/ajax.html -->
{{include "/demo/templates/ajax-1.html", $data}}
```

```
<!-- /templates/ajax-1.html -->
<h1>{{= title}}</h1>
<ul>
    {{each list as value, index}}
        <li>{{= index}} ：{{= value}}</li>
    {{/each}}    
</ul>
```

### Javascript

```
killt.renderByAjax('templates/ajax.html', {
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
},
function(html) {
  document.body.innerHTML = html
})
```

### Output

<iframe data-src="/killt/demo/ajax.html"></iframe>


## Debug/异常处理

### HTML

```
<script id="/template/debug/a.html" type="template/text">
  <h1>{{= title</h1>
  <p>{{#content}}</p>
</script>

<script id="/template/debug/b.html" type="template/text">
  {{helper}}
    <div>Hello world!!!</div>
  {{/helper}}
</script>

<script id="/template/debug/c.html" type="template/text">
  <div>{{"error helper" | helper}}</div>
</script>
```

### Javascript

```
killt.onError(function(message) {
  message = killt.helper('$escape')(message)
  document.body.innerHTML += message.replace(/\n/g, '<br>')
})

killt.renderById('/template/debug/a.html')
killt.renderById('/template/debug/b.html')
killt.renderById('/template/debug/c.html')
killt.renderById('/template/debug/d.html')
killt.renderByAjax('/template/debug/e.html', function() {})
killt.renderByAjax('http://baidu.com', function() {})
```

### Output

<iframe data-src="/killt/demo/debug.html"></iframe>