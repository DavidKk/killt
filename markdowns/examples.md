# Examples

这里就不介绍原生版本如何使用了

## Basic/基本用法

```
<script id="/template/basic.html" type="template/text">
  <h1>{{@title}}</h1>
  <ul>
      {{each list as value, index}}
          <li>{{@index}} ：{{@value}}</li>
      {{/each}}
  </ul>
</script>
```

```
oTemplate.renderById('/template/basic.html', {
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

## Compile/编译

```
<script id="/template/compile.html" type="template/text">
  <h1>{{@title}}</h1>
  <ul>
      {{each list as value, index}}
          <li>{{@index}} ：{{@value}}</li>
      {{/each}}
  </ul>
</script>
```

```
var render = oTemplate.compileById('/template/compile.html')
render({
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

## Include/引入

```
<script id="/template/include.html" type="template/text">
  <h1>{{@title}}</h1>
  {{include "/template/include/a.html", $data}}
</script>

<script id="/template/include/a.html" type="template/text">
  <h3>{{@subTitle}}</h3>
  {{include "/template/include/b.html", $data}}
</script>

<script id="/template/include/b.html" type="template/text">
  <ul>
      {{each list as value, index}}
          <li>{{@index}} ：{{@value}}</li>
      {{/each}}
  </ul>
</script>
```

```
oTemplate.renderById('/template/include.html', {
  title: 'oTemplate',
  subTitle: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
})
```

## Helper/辅助函数

```
<script id="/template/helper.html" type="template/text">
  <h1>{{@title}}</h1>
  <p>{{'Me?' | love}}</p>
  <p>{{'U' | love}}</p>
</script>
```

```
oTemplate.helper('love', function(who) {
  return /\?/.exec(who) ? 'Fuck Q!!!' : 'Love ' + who
})

document.body.innerHTML = oTemplate.renderById('/template/helper.html', {
  title: 'Helper Defination'
})
```

## Noescape/不转义

```
<script id="/template/noescape.html" type="template/text">
  <h1>{{@title}}</h1>
  <h4>默认 escape = true</h4>
  <p>{{@noescapeContent}}</p>
  <h4>不转义</h4>
  <p>{{#escapeContent}}</p>
  <h4>强制转义</h4>
  <p>{{!#escapeContent}}</p>
</script>
```

```
oTemplate.renderById('/template/noescape.html', {
  title: 'oTemplate',
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

## AJAX/异步请求模板

```
<h1>{{@title}}</h1>
<ul>
    {{each list as value, index}}
        <li>{{@index}} ：{{@value}}</li>
    {{/each}}
</ul>
```

```
oTemplate.renderByAjax('templates/ajax.html', {
  title: 'Keywords',
  list: ['Template', 'Template Engine', 'Javascript']
},
function(html) {
  document.body.innerHTML = html
})
```

