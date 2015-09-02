describe('Test OTemplate In Client.', function() {
  oTemplate.config('env', 'unit')

  // lit version
  describe('oTemplate can parse templates.', function() {
    beforeEach(function() {
      jasmine.Ajax.install()
    })

    afterEach(function() {
      jasmine.Ajax.uninstall()
    })

    it('should compile the templates.', function() {
      var render = oTemplate.compile('<%if (1) {%><div>Hello world</div><%}%>')
      expect(render()).toEqual('<div>Hello world</div>')
    })

    it('should render the templates.', function() {
      var view = oTemplate.render('<%if (1) {%><div><%= message %></div><%}%>', {
        message: 'Hello world'
      })
      expect(view).toEqual('<div>Hello world</div>')
    })

    it('should render the templates in script-node.', function() {
      document.body.innerHTML = '<script id="/templates/a.html" type="/templates/text"><%if (1) {%><div>Hello world</div><%}%></script>'

      var view = oTemplate.renderTpl('/templates/a.html')
      expect(view).toEqual('<div>Hello world</div>')
    })

    it('should render the template file by AJAX.', function(done) {
      jasmine.Ajax
      .stubRequest('/templates/b.html')
      .andReturn({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<%if (1) {%><div>Hello world</div><%}%>'
      })

      oTemplate.renderFile('/templates/b.html', {}, function(view) {
        expect(view).toEqual('<div>Hello world</div>')
        done()
      })
    })
  })
  
  // syntax version
  describe('oTemplate can parse the syntax-template.', function() {
    it('should compile the `echo` syntax.', function() {
      var shell = oTemplate.$compileSyntax('{{@ "Hello world"}}')
      expect(shell).toEqual('<%="Hello world"%>')
    })

    it('should compile the `if` syntax.', function() {
      var shell = oTemplate.$compileSyntax('{{if 1}}\n<div></div>\n{{else if 1}}\n<div></div>\n{{else}}\n<div></div>\n{{/if}}')
      expect(shell).toEqual('<%if(1) {%>\n<div></div>\n<%} else if(1) {%>\n<div></div>\n<%} else {%>\n<div></div>\n<%}%>')
    })

    it('should allow compile `each` syntax.', function() {
      var shell = oTemplate.$compileSyntax('{{each data as value, key}}\n<div></div>\n{{/each}}')
      expect(shell).toEqual('<%each(data, function(value, key) {%>\n<div></div>\n<%})%>')

      shell = oTemplate.$compileSyntax('{{each data}}\n<div></div>\n{{/each}}')
      expect(shell).toEqual('<%each(data, function() {%>\n<div></div>\n<%})%>')
    })

    it('should allow compile `include` syntax.', function() {
      var shell = oTemplate.$compileSyntax('<div>{{include "/template/modal.html", data}}</div>', true)
      expect(shell).toEqual('<div><%include("/template/modal.html", data)%></div>')
    })

    it('should allow compile `escape` syntax.', function() {
      var shell = oTemplate.$compileSyntax('{{# toString(123) }}')
      expect(shell).toEqual('<%escape(toString(123))%>')
    })

    it('should allow compile `helper` syntax.', function() {
      var shell = oTemplate.$compileSyntax('<div>{{data | helper}}</div>')
      expect(shell).toEqual('<div><%helper(data)%></div>')

      shell = oTemplate.$compileSyntax('<div>{{data | helper:a,b,c}}</div>')
      expect(shell).toEqual('<div><%helper(data,a,b,c)%></div>')

      shell = oTemplate.$compileSyntax('<div>{{data | h1:a1,b1,c1 | h2:a2,b2,c2}}</div>')
      expect(shell).toEqual('<div><%h2(h1(data,a1,b1,c1),a2,b2,c2)%></div>')
    })

    it('should allow compile all syntax at the same time.', function() {
      var shell = oTemplate.$compileSyntax([
        '{{if 1}}',
          '{{each data as value, key}}',
            '<div>{{include "/templates/index.html", data}}</div>',
          '{{/each}}',
        '{{elseif 1}}',
          '<div>{{# toString(1)}}</div>',
        '{{else if 1}}',
          '<div></div>',
        '{{else}}',
          '<div>{{ value | helper:a,b,c }}</div>',
        '{{/if}}'
      ].join('\n'))

      expect(shell).toEqual([
        '<%if(1) {%>',
          '<%each(data, function(value, key) {%>',
            '<div><%include("/templates/index.html", data)%></div>',
          '<%})%>',
        '<%} else if(1) {%>',
          '<div><%escape(toString(1))%></div>',
        '<%} else if(1) {%>',
          '<div></div>',
        '<%} else {%>',
          '<div><%helper(value,a,b,c)%></div>',
        '<%}%>'
      ].join('\n'))
    })

    it('should allow compile template which own syntax and shell.', function() {
      var shell = oTemplate.$compileSyntax('<%if(user.isLogin) {%>\n<div>{{include "/user/info.html", data}}</div>\n<%}%>')
      expect(shell).toEqual('<%if(user.isLogin) {%>\n<div><%include("/user/info.html", data)%></div>\n<%}%>')
    })
  })
  
  // customer, eg. block, helpers, syntax and so on...
  describe('oTemplate can extend utilities.', function() {
    it('should allow add helper.', function() {
      oTemplate.helper('fuck', function(who) {
        return 'Fuck ' + who + '!!!'
      })

      expect(oTemplate._helpers.fuck).toEqual(jasmine.any(Function))

      var view = oTemplate.render('<div>{{"Q" | fuck}}</div>', {})
      expect(view).toEqual('<div>Fuck Q!!!</div>')
    })

    it('should allow use block-helper for judgement.', function() {
      oTemplate.block('judge', function(yes, callback) {
        yes && callback()
      })

      expect(oTemplate._blockHelpers.judge).toEqual(jasmine.any(Function))

      var view = oTemplate.render('<div>{{judge 1}}Hello world{{/judge}}</div>')
      expect(view).toEqual('<div>Hello world</div>')
    })

    it('should allow use block-helper for each.', function() {
      oTemplate.block('foreach', function(times, callback) {
        for (var i = 0; i < times; i ++) {
          callback(i +1)
        }
      })

      expect(oTemplate._blockHelpers.foreach).toEqual(jasmine.any(Function))

      var view = oTemplate.render('<div>{{foreach 3 as times}}<span>{{@times}} Times.</span>{{/foreach}}</div>')
      expect(view).toEqual('<div><span>1 Times.</span><span>2 Times.</span><span>3 Times.</span></div>')
    })

    it('should allow use block-helper to replace the content.', function() {
      oTemplate.block('like', function(who, callback, replace) {
        replace('<span>Like ' + who + '!!!</span>')
      })

      expect(oTemplate._blockHelpers.like).toEqual(jasmine.any(Function))

      var view = oTemplate.render('<div>{{like "U"}}<div>Me?</div>{{/like}}</div>')
      expect(view).toEqual('<div><span>Like U!!!</span></div>')
    })

    it('should allow customize the syntax.', function() {
      oTemplate.$registerSyntax('hate', 'hate\\s*([^<%= closeTag %>]+)?\\s*', 'hate($1)')
      expect(oTemplate._blocks.hate).toEqual(jasmine.any(Object))

      var view = oTemplate.$compileSyntax('{{hate "U"}}')
      expect(view).toEqual('<%hate("U")%>')
    })
  })

  // error catch
  describe('oTemplate can catch the error and throw them friendly.', function() {
    it('should catch the syntax error.', function() {
      var template = '\
        {{if 1\n\
          <div></div>\n\
        {{/if}}\
      '

      var valid = oTemplate.$analyzeSyntax(template)
      expect(!!valid.message.match('Syntax error in line 1')).toBeTruthy()

      template = '\
        {{qwe}}\n\
          <div></div>\n\
        {{/qwe}}\
      '

      valid = oTemplate.$analyzeSyntax(template)
      expect(!!valid.message.match('did not match any syntax in line 1')).toBeTruthy()
    })

    it('should return the empty string in error.', function() {
      var shell = oTemplate.$compileSyntax('{{qwe}}<div></div>{{/qwe}}')
      expect(shell).toEqual('')
    })
  })

  // TODO: error issue should blew.
})