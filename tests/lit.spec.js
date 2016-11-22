describe('Test origin javascript syntax', function () {
  let _ = killt

  describe('It can compile templates', function () {
    beforeEach(function () {
      _ = _.$divide({
        env       : _.ENV.UNITEST,
        noSyntax  : true
      })
    })

    it('should compile templates', function () {
      let template =
            '<% if (1) {%>'
              + '<div>Hello world</div>'
            + '<% } %>'

      let render = _.compileSource(template)
      expect(render).toEqual(jasmine.any(Function))
      expect(render().trim()).toEqual('<div>Hello world</div>')
    })

    it('should render templates', function () {
      let template =
          '<% if (1) { %>'
            + '<div><%= message %>'
            + '</div>'
          + '<% } %>'

      let source = _.renderSource(template, {
        message: 'Hello world'
      })

      expect(source.trim()).toEqual('<div>Hello world</div>')
    })

    it('should use private variables', function () {
      let template = '<%= $runtime %>\n<%= $runtime %>'

      let source = _.renderSource(template)
      expect(source.trim()).toEqual('12')
    })

    it('should not compile keywords', function () {
      let keywords = [
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

      keywords.forEach(function (name, index) {
        let datas = {}
        datas[name] = index

        let source = _.renderSource('<%= ' + name + '%>', datas)
        expect(source).not.toEqual(index)
      })
    })

    it('should use helper', function () {
      let template = '<%= canuse_helper(data) %>'

      _.helper('canuse_helper', function (name) {
        return 'Hello ' + name
      })

      let source = _.renderSource(template, {
        data: 'World'
      })

      expect(source.trim()).toEqual('Hello World')
    })

    it('should escape html', function () {
      let template = '<%= data %>'

      let source = _.renderSource(template, {
        data: '<script></script>'
      })

      expect(source.trim()).toEqual('&lt;script&gt;&lt;/script&gt;')
    })

    it('should escape ascii', function () {
      let template = '<%= data %>'

      let source = _.renderSource(template, {
        data: '\x3c\x73\x63\x72\x69\x70\x74\x3e\x3c\x2f\x73\x63\x72\x69\x70\x74\x3e'
      })

      expect(source.trim()).toEqual('&lt;script&gt;&lt;/script&gt;')
    })

    it('should not filter remarks when compress is false', function () {
      let template = '<!-- <%= "Hello World" %> -->'
      let source = _.renderSource(template, {}, {
        compress: false
      })

      expect(source).toEqual(template)
    })
  })
})