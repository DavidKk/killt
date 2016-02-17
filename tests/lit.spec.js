describe('Test origin javascript syntax', function() {
  var _ = oTemplate

  describe('It can compile templates', function() {
    beforeEach(function() {
      _ = _.$divide({
        env       : _.ENV.UNIT,
        noSyntax  : true
      })
    })

    it('should compile templates', function() {
      var template =
            '<% if (1) {%>'
              + '<div>Hello world</div>'
            + '<% } %>'

      var render = _.compile(template)
      expect(render).toEqual(jasmine.any(Function))
      expect(render().trim()).toEqual('<div>Hello world</div>')
    })

    it('should render templates', function() {
      var template =
          '<% if (1) { %>'
            + '<div><%= message %>'
            + '</div>'
          + '<% } %>'

      var source = _.render(template, {
        message: 'Hello world'
      })

      expect(source.trim()).toEqual('<div>Hello world</div>')
    })

    it('should use private variables', function() {
      var template = '<%= $runtime %>\n<%= $runtime %>'

      var source = _.render(template)
      expect(source.trim()).toEqual('12')
    })

    it('should not compile keywords', function() {
      var keywords = [
            '$append',
            '$blocks', '$buffer',
            '$data',
            '$helpers',
            '$scope',
            '$runtime',

            'abstract', 'arguments',
            'break', 'boolean', 'byte',
            'case', 'catch', 'char', 'class', 'continue', 'console', 'const',
            'debugger', 'default', 'delete', 'do', 'double',
            'else', 'enum', 'export', 'extends',
            'false', 'final', 'finally', 'float', 'for', 'function',
            'goto',
            'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
            'let', 'long',
            'native', 'new', 'null',
            'package', 'private', 'protected', 'public',
            'return',
            'short', 'static', 'super', 'switch', 'synchronized',
            'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
            'undefined',
            'var', 'void', 'volatile',
            'while', 'with',
            'yield'
          ]

      keywords.forEach(function(name, index) {
        var datas = {}
        datas[name] = index

        var source = _.render('<%= ' + name + '%>', datas)
        expect(source).not.toEqual(index)
      })
    })

    it('should use helper', function() {
      var template = '<%= canuse_helper(data) %>'

      _.helper('canuse_helper', function(name) {
        return 'Hello ' + name
      })

      var source = _.render(template, {
        data: 'World'
      })

      expect(source.trim()).toEqual('Hello World')
    })

    it('should escape html', function() {
      var template = '<%= data %>'

      var source = _.render(template, {
        data: '<script></script>'
      })

      expect(source.trim()).toEqual('&lt;script&gt;&lt;/script&gt;')
    })

    it('should escape ascii', function() {
      var template = '<%= data %>'

      var source = _.render(template, {
        data: '\x3c\x73\x63\x72\x69\x70\x74\x3e\x3c\x2f\x73\x63\x72\x69\x70\x74\x3e'
      })

      expect(source.trim()).toEqual('&lt;script&gt;&lt;/script&gt;')
    })

    it('should not filter remarks when compress is false', function() {
      var template = '<!-- <%= "Hello World" %> -->'
      var source = _.render(template, {}, {
        compress: false
      })

      expect(source).toEqual(template)
    })
  })
})