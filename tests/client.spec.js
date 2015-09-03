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

  // TODO: error issue should blew.
})