# killt

killt is a light template engine for Javascript.

### Examples & Docs

[http://davidkk.github.io/killt](http://davidkk.github.io/killt)

### Install

```
npm install killt
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
      <li><%= index %>: <%= value %></li>
    <%})%>
  </ul>
</script>
```

#### Default Syntax Version
```
# Template In HTML
<script id="templates/list/default.html" type="template/text">
  <h1>{{= title}}</h1>
  <ul>
      {{each list as value index}}
          <li>{{= index}}: {{= value}}</li>
      {{\/each}}
  </ul>
</script>
```

### Compile and Render
```
// Source
killt.compile([String source], [Object options])
killt.render([String source], [Object Data], [Object options])

// Nested
script(id="/template/inline.html", type="template/text")
killt.compileSync([String TemplateId], [Object options])
killt.renderSync([String TemplateId], [Object data], [Object options])

// Ajax
killt.compileAsync([String url], [Function callback], [Object options])
killt.renderAsync([String url], [Object data], [Function callback], [Object options])
```

#### Compiled by template
```
var killt = window.killt
var killt = require('killt')

killt.renderSync('templates/list/default.html', {
  title: 'Customer Title',
  list: {
    Author: 'David Jones',
    Gender: 'Male'
  }
})
```

##### Compiled by Ajax
```
killt.renderAsync('templates/list/default.html', function(html) {
  // do something...
})
```

#### Customize Helpers

```
killt.helper('hate', function(who) {
  return 'Hate ' + who + '!!!'
})

// HTML
{{"U" | hate}}

// Output
'Hate U !!!'
```

#### Customize Block (full version, not in lite version)

```
killt.block('like', function(who, blockShell) {
  return who ? 'Like ' + who + '!!!' : blockShell()
})

// HTML
{{like 'U'}}Me?{{/like}}

// Output
'Like U!!!'
```

#### Customize Syntax (full version, not in lite version)

```
killt.$registerSyntax('fuck', 'fuck\\s*([\\w\\W]+?)\\s*', 'fuck($1)')

// HTML
{{fuck 'Q'}}

// Be comipled to native template is
<% fuck('Q'); %>
```

Note: `fuck` is a helper, so u must use `killt.helper('fuck', function() {})` to add a helper.

### Details

[See the code and the detailed annotate...](https://github.com/DavidKk/killt/blob/master/dist/es6/client/killt.js)

### Updates

