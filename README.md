# oTemplate

oTempalte is a light template engine for Javascript.

### Examples & Docs

[http://davidkk.github.io/oTemplate](http://davidkk.github.io/oTemplate)

### Install

```
bower install oTemplate
```

### Features

- Support request template by ajax.
- Support comstom block helper.
- Support comstom syntax.
- Support compiled caches.
- Support UMD.

### How can i use?

#### Lit Version

```
<script id="templates/list/default.html" type="template/text">
  <h1><%= title %></h1>
  <ul>
    <%each(list, function(value, index) {%>
      <li><%= index %>: <%= @value %></li>
    <%})%>
  </ul>
</script>
```

#### Default Syntax Version
```
# Template In HTML
<script id="templates/list/default.html" type="template/text">
  <h1>{{@title}}</h1>
  <ul>
      {{each list as value index}}
          <li>{{@index}}: {{@value}}</li>
      {{\/each}}
  </ul>
</script>
```

### Compile and Render
```
// Source
oTempalte.compile([String source], [Object options])
oTemplate.render([String source], [Object Data], [Object options])

// Nested
script(id="/template/inline.html", type="template/text")
oTemplate.compileById([String TemplateId], [Object options])
oTemplate.renderById([String TemplateId], [Object data], [Object options])

// Ajax
oTemplate.compileByAjax([String url], [Function callback], [Object options])
oTemplate.renderByAjax([String url], [Object data], [Function callback], [Object options])
```

#### Compiled by template
```
var oTemplate = window.oTemplate
var oTempalte = require('oTemplate')

oTemplate.renderById('templates/list/default.html', {
  title: 'Customer Title',
  list: {
    Author: 'David Jones',
    Gender: 'Male'
  }
})
```

##### Compiled by Ajax
```
oTemplate.renderByAjax('templates/list/default.html', function(html) {
  // do something...
})
```

#### Customize Helpers

```
oTemplate.helper('hate', function(who) {
  return 'Hate ' + who + '!!!'
})

// HTML
{{"U" | hate}}

// Output
'Hate U !!!'
```

#### Customize Block (full version, not in lite version)

```
oTemplate.block('like', function(who, blockShell) {
  return who ? 'Like ' + who + '!!!' : blockShell()
})

// HTML
{{like 'U'}}Me?{{/like}}

// Output
'Like U!!!'
```

#### Customize Syntax (full version, not in lite version)

```
oTemplate.$registerSyntax('fuck', 'fuck\\s*([\\w\\W]+?)\\s*', 'fuck($1)')

// HTML
{{fuck 'Q'}}

// Be comipled to native template is
<% fuck('Q'); %>
```

Note: `fuck` is a helper, so u must use `oTemplate.helper('fuck', function() {})` to add a helper.

### Details

[See the code and the detailed annotate...](https://github.com/DavidKk/oTemplate/blob/master/dist/client/oTemplate.js)

### Updates

