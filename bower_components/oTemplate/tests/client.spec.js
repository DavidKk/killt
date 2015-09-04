describe('Test OTemplate In Client.', function() {
  oTemplate.config('env', 'unit')

  beforeEach(function() {
    jasmine.Ajax.install()
  })

  afterEach(function() {
    jasmine.Ajax.uninstall()
  })

  // lit version
  describe('oTemplate can parse templates.', function() {
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

  describe('oTemplate can parse nested templates.', function() {
    it('should render the nested templates in script-node.', function() {
      var template = [
        '<script id="/templates/c.html" type="template/text"><%include("/templates/d.html", { mesage: "Hello Nested!!!" })%></script>',
        '<script id="/templates/d.html" type="template/text"><div><%= mesage %></div></script>'
      ]

      document.body.innerHTML = template.join('')
      var view = oTemplate.renderTpl('/templates/c.html')
      expect(view).toEqual('<div>Hello Nested!!!</div>')
    })

    it('should render the nested templates file by AJAX.', function(done) {
      jasmine.Ajax
      .stubRequest('/templates/e.html')
      .andReturn({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<%include("/templates/f.html", { mesage: "Hello AJAX!!!" })%>'
      })

      jasmine.Ajax
      .stubRequest('/templates/f.html')
      .andReturn({
        status: 200,
        statusText: 'HTTP/1.1 200 OK',
        contentType: 'text/xml;charset=UTF-8',
        responseText: '<div><%= mesage %></div>'
      })

      oTemplate.renderFile('/templates/e.html', {}, function(view) {
        expect(view).toEqual('<div>Hello AJAX!!!</div>')
        done()
      })
    })
  })

  // TODO: error issue should blew.
})