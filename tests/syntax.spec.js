describe('Test the simple syntax', function () {
  let _ = killt

  describe('It can compile simple syntax to origin syntax', function () {
    beforeEach(function () {
      _ = _.$divide({
        env: _.ENV.UNITEST
      })
    })

    it('should compile the `echo` syntax', function () {
      let shell = _.$compileSyntax('{{= "Hello World" }}')
      expect(shell).toEqual('<%="Hello World"%>')
    })

    it('should compile the `logic` syntax', function () {
      let shell = _.$compileSyntax('{{- var i = 0 }}')
      expect(shell).toEqual('<%var i = 0%>')
    })

    it('should solve the `||` and `&&` operators in echo syntax', function () {
      let shell = _.$compileSyntax('{{= aa || bb && cc }}')
      expect(shell).toEqual('<%=aa || bb && cc%>')
    })

    it('should compile the `if` syntax', function () {
      let template =
            '{{if 1}}'
          +   '<div></div>'
          + '{{else if 1}}'
          +   '<div></div>'
          + '{{else}}'
          +   '<div></div>'
          + '{{/if}}'

      let result =
            '<%if (1) {%>'
          +   '<div></div>'
          + '<%} else if (1) {%>'
          +   '<div></div>'
          + '<%} else {%>'
          +   '<div></div>'
          + '<%}%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile `each` syntax', function () {
      let template =
            '{{each data as value, key}}'
          +   '<div></div>'
          + '{{/each}}'

      let result =
            '<%each(data, function (value, key) {%>'
          +   '<div></div>'
          + '<%})%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))

      template =
        '{{each data}}'
      +   '<div></div>'
      + '{{/each}}'

      result =
        '<%each(data, function ($value, $index) {%>'
      +   '<div></div>'
      + '<%})%>'

      shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile `include` syntax', function () {
      let template = '<div>{{include /template/modal.html, data}}</div>'
      let result = '<div><%#include( \'/template/modal.html\', data)%></div>'

      let shell = _.$compileSyntax(template, true)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))

      template = '<div>{{include "/template/modal.html"}}</div>'
      result = '<div><%#include(\'/template/modal.html\', $data)%></div>'

      shell = _.$compileSyntax(template, true)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile `noescape` syntax', function () {
      let template = '{{# toString(123) }}'
      let result = '<%#toString(123)%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile `escape` syntax', function () {
      let template = '{{!# toString(123) }}'
      let result = '<%!#toString(123)%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile `helper` syntax', function () {
      let template = '<div>{{data | helper}}</div>'
      let result = '<div><%helper(data)%></div>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))

      template = '<div>{{data | helper:a,b,c}}</div>'
      result = '<div><%helper(data,a,b,c)%></div>'

      shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))

      template = '<div>{{#data | $h1:a_1,b_1,c_1 | h2:a2,b2,c2}}</div>'
      result = '<div><%#h2($h1(data,a_1,b_1,c_1),a2,b2,c2)%></div>'

      shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should allow compile all syntax at the same time', function () {
      let template =
            '{{if 1}}'
          +   '{{each data as value, key}}'
          +     '<div>{{include /templates/index.html, data}}</div>'
          +   '{{/each}}'
          + '{{elseif 1}}'
          +   '<div>{{# toString(1)}}</div>'
          + '{{else if 1}}'
          +   '<div></div>'
          + '{{else}}'
          +   '<div>{{ value | helper:a,b,c }}</div>'
          + '{{/if}}'

      let result =
            '<%if (1) {%>'
          +   '<%each(data, function (value, key) {%>'
          +     '<div><%# include(\'/templates/index.html\', data)%></div>'
          +   '<%})%>'
          + '<%} else if (1) {%>'
          +   '<div><%#toString(1)%></div>'
          + '<%} else if (1) {%>'
          +   '<div></div>'
          + '<%} else {%>'
          +   '<div><%helper(value,a,b,c)%></div>'
          + '<%}%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should escape the javascript syntax when noSyntax turned off', function () {
      let template = '<%= error %>'

      let source = _.compileSource(template, {
        error: 123
      })

      expect(source).not.toEqual(123)
    })

    it('should allow compile `v1 && v2 || v3 | helper` in syntax version', function () {
      let template = '{{a || b | image}}{{b || c | image}}'
      let result = '<%image(a || b)%><%image(b || c)%>'

      let shell = _.$compileSyntax(template)
      expect(shell.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })
  })

  describe('It can compile simple template', function () {
    beforeEach(function () {
      _ = _.$divide({
        env: _.ENV.UNIT
      })
    })

    it('should support the wrap syntax', function() {
      let template = `
            {{- var action = "Hello"}}
            {{- var name = "World"}}
            {{- var datas = [
                  { name: "David" },
                  { name: "Jones" }
                ]
            }}
            {{if action}}
              <div data-id="{{= data}}">{{= action + " " + name}}</div>
            {{/if}}

            {{each datas as author}}
              <div>{{= author.name}}</div>
            {{/each}}`

      let result =
            '<div data-id="">Hello World</div>'
          + '<div>David</div>'
          + '<div>Jones</div>'

      let source = _.renderSource(template)
      expect(source.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })

    it('should auto escape source', function() {
      let template = `
        <div data-id="{{= "id-123" }}"><div>
        <%= 123 %>
        {{= script }}
        {{= ascii }}
        {{= iso88591 }}
      `

      let result =
            '<div data-id="id-123"><div>'
          + '&lt;%= 123 %&gt; &lt;script&gt;&lt;/script&gt;'
          + '&lt;script&gt;&lt;/script&gt;'
          + '&#60;&#115;&#99;&#114;&#105;&#112;&#116;&#62;&#60;&#47;&#115;&#99;&#114;&#105;&#112;&#116;&#62;'

      let source = _.renderSource(template, {
        script    : '<script></script>',
        ascii     : '\x3c\x73\x63\x72\x69\x70\x74\x3e\x3c\x2f\x73\x63\x72\x69\x70\x74\x3e',
        iso88591  : '&#60;&#115;&#99;&#114;&#105;&#112;&#116;&#62;&#60;&#47;&#115;&#99;&#114;&#105;&#112;&#116;&#62;',
      })

      expect(source.replace(/\s+/g, '')).toEqual(result.replace(/\s+/g, ''))
    })
  })

  describe('It allow extend utilities in syntax mode', function () {
    beforeEach(function () {
      _ = _.$divide({
        env: _.ENV.UNIT
      })
    })

    it('should allow add helper', function () {
      expect(_._helpers.say).toEqual(undefined)

      _.helper('say', function (what) {
        return 'Hello ' + what + '!!!'
      })

      expect(_._helpers.say).toEqual(jasmine.any(Function))

      let template = '<div>{{ "World" | say }}</div>'
      let result = '<div>Hello World!!!</div>'

      let source = _.renderSource(template)
      expect(source).toEqual(result)
    })

    it('should allow use block-helper for judgement', function () {
      expect(_._blockHelpers.say).toEqual(undefined)

      _.block('say', function (whether, blockShell) {
        return 'yes' === whether ? blockShell() : ''
      })

      expect(_._blockHelpers.say).toEqual(jasmine.any(Function))

      let template = '<div>{{say "yes"}}Hello world{{/say}}</div>'
      let result = '<div>Hello world</div>'

      let source = _.renderSource(template)
      expect(source).toEqual(result)
    })

    it('should allow use block-helper for each', function () {
      expect(_._blockHelpers.loop).toEqual(undefined)

      _.block('loop', function (times, blockShell) {
        let str = ''
        for (let i = 0; i < times; i ++) {
          str += blockShell(i +1)
        }

        return str
      })

      expect(_._blockHelpers.loop).toEqual(jasmine.any(Function))

      let template =
        '{{loop 3 : times}}'
      +   '<span>{{= times }} Times.</span>'
      + '{{/loop}}'

      let result =
        '<span>1 Times.</span>'
      + '<span>2 Times.</span>'
      + '<span>3 Times.</span>'

      let source = _.renderSource(template)
      expect(source).toEqual(result)
    })

    it('should allow use block-helper to replace the content.', function () {
      expect(_._blockHelpers.like).toEqual(undefined)

      _.block('say', function (what) {
        return '<span>Say ' + what + '!!!</span>'
      })

      expect(_._blockHelpers.say).toEqual(jasmine.any(Function))

      let template =
        '<div>'
      +   '{{say "Hello"}}'
      +     '<div>Hello World?</div>'
      +   '{{/say}}'
      + '</div>'

      let result =
        '<div>'
      +   '<span>Say Hello!!!</span>'
      + '</div>'

      let source = _.renderSource(template)
      expect(source).toEqual(result)
    })

    it('should allow customize the syntax.', function () {
      _.$registerSyntax('say', 'say\\s*([\\w\\W]+?)\\s*', 'say($1)')

      expect(_._blocks.say).toEqual(jasmine.any(Object))

      let template = '{{say "Hello World"}}'
      let result = '<%say("Hello World")%>'

      let source = _.$compileSyntax(template)
      expect(source).toEqual(result)
    })
  })

  describe('It can catch the error and throw them friendly', function() {
    beforeEach(function() {
      _ = _.$divide({
        env: _.ENV.UNIT
      })
    })

    it('should return the empty string in error', function() {
      let shell = _.$compileSyntax('{{')
      expect(shell).toEqual('')
    })

    it('should catch the syntax error', function() {
      let template =
            '{{if 1\
                <div></div>\
              {{/if}}'

      _.on('error', function(error) {
        expect(!!error.message.match('Syntax error in line 1')).toBeTruthy()
      })

      let source = _.$compileSyntax(template)
      expect(source).toEqual('')
    })

    it('should catch the error which not match any syntax', function() {
      let template =
      `{{qwe}}
        <div></div>
      {{/qwe}}`

      _.on('error', function(error) {
        expect(!!error.message.match('did not match any syntax in line 1')).toBeTruthy()
      })

      let source = _.$compileSyntax(template)
      expect(source).toEqual('')
    })
  })

  describe('It can complete some examples below', function() {
    beforeEach(function() {
      _ = _.$divide({
        env: _.ENV.UNIT
      })

      jasmine.Ajax.install()
    })

    afterEach(function() {
      jasmine.Ajax.uninstall()
      document.body.innerHTML = ''
    })

    it('should complete basic examples', function() {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +   '<h1>{{= title }}</h1>'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{= index}}: {{= value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      let result =
            '<h1>Keywords</h1>'
          + '<ul>'
          +   '<li>0: Template</li>'
          +   '<li>1: Template Engine</li>'
          +   '<li>2: Javascript</li>'
          + '</ul>'

      let source = _.renderSync('templates/nested.html', {
        title: 'Keywords',
        list: ['Template', 'Template Engine', 'Javascript']
      })

      expect(source).toEqual(result)
    })

    it('should complete compile examples', function() {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +   '<h1>{{= title }}</h1>'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{= index}}: {{= value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      let result =
            '<h1>Keywords</h1>'
          + '<ul>'
          +   '<li>0: Template</li>'
          +   '<li>1: Template Engine</li>'
          +   '<li>2: Javascript</li>'
          + '</ul>'

      let render = _.compileSync('templates/nested.html')

      let source = render({
        title: 'Keywords',
        list: ['Template', 'Template Engine', 'Javascript']
      })

      expect(source).toEqual(result)
    })

    it('should complete helper examples', function() {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +  '<h1>{{= title }}</h1>'
        +  '<p>{{ "Hello World" | say }}</p>'
        +  '<p>{{ "what?" | say }}</p>'
        + '</script>'

      let result =
            '<h1>Helper Defination</h1>'
          + '<p>Hello World</p>'
          + '<p>Welcome</p>'

      _.helper('say', function(what) {
        return 'what?' === what ? 'Welcome' : what
      })

      let source = _.renderSync('templates/nested.html', {
        title: 'Helper Defination'
      })

      expect(source).toEqual(result)
    })

    it('should complete include examples', function() {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +   '<h1>{{= title }}</h1>'
        +   '{{include templates/nested/a.html }}'
        + '</script>'

        + '<script id="templates/nested/a.html" type="template/text">'
        +   '<h3>{{= subTitle }}</h3>'
        +   '{{include templates/nested/b.html }}'
        + '</script>'

        + '<script id="templates/nested/b.html" type="template/text">'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{=index}}: {{=value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      let result =
            '<h1>Hello World</h1>'
          + '<h3>Keywords</h3>'
          + '<ul>'
          +   '<li>0: Template</li>'
          +   '<li>1: Template Engine</li>'
          +   '<li>2: Javascript</li>'
          + '</ul>'

      let source = _.renderSync('templates/nested.html', {
        title     : 'Hello World',
        subTitle  : 'Keywords',
        list      : ['Template', 'Template Engine', 'Javascript']
      })

      expect(source).toEqual(result)
    })

    it('should complete noescape examples', function() {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +  '<h1>{{= title }}</h1>'
        +   '<h4>default escape = true</h4>'
        +   '<div>{{= noescapeContent }}</div>'
        +   '<h4>no escape</h4>'
        +   '<div>{{# escapeContent }}</div>'
        +   '<h4>force escape</h4>'
        +   '<div>{{!# escapeContent }}</div>'
        + '</script>'

      let result =
            '<h1>Hello World</h1>'
          + '<h4>default escape = true</h4>'
          + '<div>&lt;p&gt;Check it out!!!&lt;/p&gt;</div>'
          + '<h4>no escape</h4>'
          + '<div>'
          +   '<p>Check it out!!!</p>'
          + '</div>'
          + '<h4>force escape</h4>'
          + '<div>&lt;p&gt;Check it out!!!&lt;/p&gt;</div>'

      let source = _.renderSync('templates/nested.html', {
        title           : 'Hello World',
        noescapeContent : '<p>Check it out!!!</p>',
        escapeContent   : '<p>Check it out!!!</p>'
      },
      {
        escape: true
      })

      expect(source).toEqual(result)
    })

    it('should not filter remarks when compress is false', function() {
      let template = '<!-- {{= "Hello World" }} -->'
      let source = _.renderSource(template, {}, {
        compress: false
      })

      expect(source).toEqual(template)
    })
  })
})