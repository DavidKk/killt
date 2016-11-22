describe('Test in client', function () {
  let _ = killt

  describe('It can compile templates', function () {
    beforeEach(function () {
      _ = _.$divide({
        env       : _.ENV.UNITEST,
        noSyntax  : true,
      })

      jasmine.Ajax.install()
    })

    afterEach(function () {
      jasmine.Ajax.uninstall()
      document.body.innerHTML = ''
    })

    it('should render nested templates', function () {
      document.body.innerHTML =
        '<script id="templates/nested.html" type="template/text">'
      +   '<%if (true) {%>'
      +     '<div>Hello world</div>'
      +   '<%}%>'
      + '</script>'

      let source = _.renderSync('templates/nested.html')
      expect(source).toEqual('<div>Hello world</div>')
    })

    it('should render remote templates', function (done) {
      _.render('templates/remote.html', {}, function (error, source) {
        expect(source).toEqual('<div>Hello world</div>')
        done()
      })

      jasmine.Ajax.requests
      .mostRecent()
      .respondWith({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText:
            '<%if (true) {%>'
          +   '<div>Hello world</div>'
          + '<%}%>'
      })
    })

    it('should render remote templates which include the nested templates', function (done) {
      _.render('template/remote.html', {}, function (error, source) {
        expect(source).toEqual('<div>Hello World</div><script id="template/nested.html" type="text/template"><div>Hello World</div></script>')
        done()
      })

      jasmine.Ajax.requests
      .mostRecent()
      .respondWith({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<%# include("template/nested.html") %>'
        + '<script id="template/nested.html" type="text/template">'
        +   '<div>Hello World</div>'
        + '</script>'
      })
    })

    it('should render remote templates which include the nested templates in body', function (done) {
      document.body.innerHTML =
        '<script id="template/nested.html" type="text/template">'
      +   '<div>Hello World</div>'
      + '</script>'

      _.render('template/remote.html', {}, function (error, source) {
        expect(source).toEqual('<div>Hello World</div>')
        done()
      })

      jasmine.Ajax.requests
      .mostRecent()
      .respondWith({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<%# include("template/nested.html") %>'
      })
    })
  })

  describe('It can compile nested templates.', function () {
    beforeEach(function () {
      _ = _.$divide({
        env: _.ENV.UNIT,
        noSyntax  : true
      })

      jasmine.Ajax.install()
    })

    afterEach(function () {
      jasmine.Ajax.uninstall()

      document.body.innerHTML = ''
    })

    it('should render the nested templates', function () {
      document.body.innerHTML =
          '<script id="templates/nested.html" type="template/text">'
        +   '<%# include("templates/nested/a.html", {'
        +     'mesage: "Hello Nested Template!!!"'
        +   '}) %>'
        + '</script>'

        + '<script id="templates/nested/a.html" type="template/text">'
        +   '<div><%= mesage %></div>'
        + '</script>'

      let source = _.renderSync('templates/nested.html')
      expect(source).toEqual('<div>Hello Nested Template!!!</div>')
    })

    it('should render the remote templates which included other remote templates', function (done) {
      jasmine.Ajax
      .stubRequest('templates/nested/a.html')
      .andReturn({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<div><%= mesage %></div>'
      })

      jasmine.Ajax
      .stubRequest('templates/nested.html')
      .andReturn({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText:
            '<%# include("templates/nested/a.html", {'
          +   'mesage: "Hello Remote Template!!!"'
          + '})%>'
      })

      _.render('templates/nested.html', {}, function (error, source) {
        expect(source).toEqual('<div>Hello Remote Template!!!</div>')
        done()
      })
    })
  })
})