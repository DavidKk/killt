# oTemplate

oTempalte is a light template engine for Javascript.

### Install

```
bower install oTemplate
```

### Docs

[http://davidkk.github.io/oTemplate](http://davidkk.github.io/oTemplate)

### How can i use?

```
var oTempalte = require('oTemplate');

// Source
oTempalte.compile('<div></div>', options)
oTemplate.render('<div></div>', data, options)

// Nested
script(id="/template/inline.html", type="template/text")
oTemplate.compileById('/template/inline.html', options)
oTemplate.renderById('/template/index.html', data, options)

// Ajax
oTemplate.compileFile('/template/index.html', callback, options)
oTemplate.renderFile('/template/index.html', data, callback, options)
```

### Lite

```
<%if (true) {%>
  <div>Hello World</div>
<%}%>

<% for (var i = 0 ; i < 10; i ++) {%>
  <div><%= i %> Times</div>
<% } %>

<% helper(data) %>
<% include(data) %>
```

### Syntax

```
{{if true}}
  <div>Hello World</div>
{{/if}}

{{each data as value, key}}
  <div>{{@key}}:{{@value}}</div>
{{/each}}

{{helper(data)}}
{{include "/templates/index.html", data}}

{{block data : value}}
  <div>{{value}}</div>
{{/block}}
```

#### Customize Helpers

```
var oTempalte = require('oTemplate')
oTemplate.helper('hate', function(who) {
  return 'Hate ' + who + '!!!'
})

// HTML
{{"U" | hate}}
```

#### Customize Block (full version, not in lite version)

```
var oTempalte = require('oTemplate')
oTemplate.block('like', function(who, $append, blockShell) {
  $append(who ? '<span>Like ' + who + '!!!</span>' : blockShell())
})

// HTML
{{like 'U'}}<div>Me?</div>{{/like}}
```

#### Customize Syntax (full version, not in lite version)

```
var oTemplate = require('oTemplate')
oTemplate.$registerSyntax('fuck', 'fuck\\s*([^<%= closeTag %>]+)?\\s*', 'fuck($1)')

// HTML
{{fuck 'Q'}}
```

Note: `fuck` is a helper, so u must use `oTemplate.helper('fuck', function() {})` to add a helper.

#### Detail

[See the code and the annotate...](https://github.com/DavidKk/oTemplate/blob/master/dist/oTemplate.js)