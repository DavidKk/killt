describe('Test OTemplate Library.', function() {
  oTemplate.config('env', 'unit')

  describe('Compiler can compile the template.', function() {
    it('should allow compile if syntax.', function() {
      var source = oTemplate.$compileSyntax('{{if 1}}\n<div></div>\n{{else if 1}}\n<div></div>\n{{else}}\n<div></div>\n{{/if}}')
      expect(source).toEqual('<%if(1) {%>\n<div></div>\n<%} else if(1) {%>\n<div></div>\n<%} else {%>\n<div></div>\n<%}%>')
    })

    it('should allow compile each syntax.', function() {
      var source = oTemplate.$compileSyntax('{{each data as value, key}}\n<div></div>\n{{/each}}')
      expect(source).toEqual('<%each(data, function(value, key) {%>\n<div></div>\n<%})%>')

      source = oTemplate.$compileSyntax('{{each data}}\n<div></div>\n{{/each}}')
      expect(source).toEqual('<%each(data, function() {%>\n<div></div>\n<%})%>')
    })

    it('should allow compile include syntax.', function() {
      var source = oTemplate.$compileSyntax('<div>{{include "/template/modal.html", data}}</div>', true)
      expect(source).toEqual('<div><%include("/template/modal.html", data)%></div>')
    })

    it('should allow compile escape syntax.', function() {
      var source = oTemplate.$compileSyntax('{{# toString(123) }}')
      expect(source).toEqual('<%escape(toString(123))%>')
    })

    it('should allow compile helper syntax.', function() {
        var source = oTemplate.$compileSyntax('<div>{{data | helper:a,b,c}}</div>')
        expect(source).toEqual('<div><%helper(data,a,b,c)%></div>')

        var source = oTemplate.$compileSyntax('<div>{{data | h1:a1,b1,c1 | h2:a2,b2,c2}}</div>')
        expect(source).toEqual('<div><%h2(h1(data,a1,b1,c1),a2,b2,c2)%></div>')
    })

    it('should allow compile mixin syntax.', function() {
      var source = oTemplate.$compileSyntax([
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

      expect(source).toEqual([
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
      '<%}%>'].join('\n'))
    })

    it('should allow compile syntax to shell.', function() {
      // in mixin syntax
      var syntax = oTemplate.$compileSyntax('\
            <%if(user.isLogin) {%>\n\
              <div>{{include "/user/info.html", data}}</div>\n\
            <%}%>\
          '),
          source = oTemplate.$compileShell(syntax)

      expect(new Function(source)).toEqual(jasmine.any(Function))
    })

    it('should allow compile syntax to function.', function() {
      // in mixin syntax
      var render = oTemplate.$compile('\
            <%if(user) {%>\n\
              <div>{{include "qweqw", data}}</div>\n\
            <%}%>\
          ')

      expect(render).toEqual(jasmine.any(Function))
    })
  })

  describe('Compiler can custom something.', function() {
    it('should allow register the function helper.', function() {
      oTemplate.helper('helperName', function() {})
      expect(oTemplate._helpers.helperName).toEqual(jasmine.any(Function))
    })

    it('should allow register the block helper.', function() {
      oTemplate.block('block', function() {})
      expect(oTemplate._helpers.block).toEqual(jasmine.any(Function))

      var source = oTemplate.$compileSyntax('{{block dataA, dataB as value, key}}\n<div></div>\n{{/block}}')
      expect(source).toEqual('<%block(dataA, dataB, function(value, key) {%>\n<div></div>\n<%})%>')
    })

    it('should allow register the syntax.', function() {
      oTemplate.$registerSyntax('customer', 'customerLogic\\s*([^\\s]+)?\\s*', 'customerLogic($1)')
      expect(oTemplate._blocks.customer).toEqual(jasmine.any(Object))

      var source = oTemplate.$compileSyntax('{{customerLogic data}}')
      expect(source).toEqual('<%customerLogic(data)%>')
    })
  })

  describe('Compiler can catch some error.', function() {
    it('should catch the syntax error.', function() {
      var valid = oTemplate.$analyzeSyntax('\
          {{if 1\n\
            <div></div>\n\
          {{/if}}\
        ')

      expect(!!valid.message.match('Syntax error in line 1')).toBeTruthy()

      valid = oTemplate.$analyzeSyntax('\
          {{qwe}}\n\
            <div></div>\n\
          {{/qwe}}\
        ')

      expect(!!valid.message.match('did not match any syntax in line 1')).toBeTruthy()

      var shell = oTemplate.$compileSyntax('\
          {{qwe}}\n\
            <div></div>\n\
          {{/qwe}}\
        ')

      expect(shell).toEqual('')
    })
  })

  // TODO: error issue should blew.
})