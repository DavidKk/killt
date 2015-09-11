## oTemplate

oTemplate is a template engine for Javascript.

## Install
```
bower install oTemplate
```

## Features

- Support request template by ajax.
- Support comstom block helper.
- Support comstom syntax.
- Support compiled caches.
- Support UMD.

## How can i use?

### Lit Version

## Compile and Render

```
// Source
oTempalte.compile([String source], [Object options])
oTemplate.render([String source], [Object Data], [Object options])

// Nested
script(id="/template/inline.html", type="template/text")
oTemplate.compileById([String TemplateId], [Object options])
oTemplate.renderById([String TemplateId], [Object data], [Object options])

// Ajax
oTemplate.compileFile([String File], [Function callback], [Object options])
oTemplate.renderFile([String File], [Object data], [Function callback], [Object options])
```

### Compileted by Element

```
var oTemplate = window.oTemplate
var oTempalte = require('oTemplate')

oTemplate.renderById('templates/list/default.html', {
  title: 'Customer Title',
  list: {
    Author: 'David Jones',
    Gender: 'Male'e
  }
})
```

### Compiled by Ajax

```
oTemplate.renderByAjax('templates/list/default.html', function(html) {
  // do something...
})
```

### Customize Helpers

```
oTemplate.helper('hate', function(who) {
  return 'Hate ' + who + '!!!'
})

// HTML
{{"U" | hate}}

// Output
'Hate U !!!'
```

## Customize Block (full version, not in lite version)

```
oTemplate.block('like', function(who, $append, blockShell) {
  $append(who ? 'Like ' + who + '!!!' : blockShell())
})

// HTML
{{like 'U'}}Me?{{/like}}

// Output
'Like U!!!'
```

## Customize Syntax (full version, not in lite version)

```
oTemplate.$registerSyntax('fuck', 'fuck\\s*([^\s]+?)\\s*', 'fuck($1)')

// HTML
{{fuck 'Q'}}

// Be comipled to native template is
<% fuck('Q'); %>
```

Note: `fuck` is a helper, so u must use `oTemplate.helper('fuck', function() {})` to add a helper.