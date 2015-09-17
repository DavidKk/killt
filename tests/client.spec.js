describe('Test OTemplate In Client.', function() {
  oTemplate.config('env', oTemplate.ENV.UNIT)

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

      var view = oTemplate.renderById('/templates/a.html')
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

      oTemplate.renderByAjax('/templates/b.html', {}, function(view) {
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
      var view = oTemplate.renderById('/templates/c.html')
      expect(view).toEqual('&lt;div&gt;Hello Nested!!!&lt;/div&gt;')
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

      oTemplate.renderByAjax('/templates/e.html', {}, function(view) {
        expect(view).toEqual('&lt;div&gt;Hello AJAX!!!&lt;/div&gt;')
        done()
      })
    })
  })

  describe('oTemplate can complete examples below.', function() {
    it('basic', function() {
      document.body.innerHTML = 
        '<script id="/template/basic.html" type="template/text">'
        +   '<h1>{{@title}}</h1>'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{@index}} ：{{@value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      var view = oTemplate.renderById('/template/basic.html', {
        title: 'Keywords',
        list: ['Template', 'Template Engine', 'Javascript']
      })

      expect(view).toEqual('<h1>Keywords</h1><ul><li>0 ：Template</li><li>1 ：Template Engine</li><li>2 ：Javascript</li></ul>')
    })

    it('compile', function() {
      document.body.innerHTML = 
        '<script id="/template/compile.html" type="template/text">'
        +   '<h1>{{@title}}</h1>'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{@index}} ：{{@value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      var render = oTemplate.compileById('/template/compile.html')

      var view = render({
        title: 'Keywords',
        list: ['Template', 'Template Engine', 'Javascript']
      })

      expect(view).toEqual('<h1>Keywords</h1><ul><li>0 ：Template</li><li>1 ：Template Engine</li><li>2 ：Javascript</li></ul>')
    })

    it('helper', function() {
      document.body.innerHTML = 
        '<script id="/template/helper.html" type="template/text">'
        +  '<h1>{{@title}}</h1>'
        +  '<p>{{"Me?" | love}}</p>'
        +  '<p>{{"U" | love}}</p>'
        + '</script>'

      oTemplate.helper('love', function(who) {
        return /\?/.exec(who) ? 'Fuck Q!!!' : 'Love ' + who
      })

      var view = oTemplate.renderById('/template/helper.html', {
        title: 'Helper Defination'
      })

      expect(view).toEqual('<h1>Helper Defination</h1><p>Fuck Q!!!</p><p>Love U</p>')
    })

    it('include', function() {
      document.body.innerHTML = 
        '<script id="/template/include.html" type="template/text">'
        +   '<h1>{{@title}}</h1>'
        +   '{{include "/template/include/a.html"}}'
        + '</script>'

        + '<script id="/template/include/a.html" type="template/text">'
        +   '<h3>{{@subTitle}}</h3>'
        +   '{{include "/template/include/b.html"}}'
        + '</script>'

        + '<script id="/template/include/b.html" type="template/text">'
        +   '<ul>'
        +     '{{each list as value, index}}'
        +       '<li>{{@index}} ：{{@value}}</li>'
        +     '{{/each}}'
        +   '</ul>'
        + '</script>'

      var view = oTemplate.renderById('/template/include.html', {
        title: 'oTemplate',
        subTitle: 'Keywords',
        list: ['Template', 'Template Engine', 'Javascript']
      })

      expect(view).toEqual('<h1>oTemplate</h1><h3>Keywords</h3><ul><li>0 ：Template</li><li>1 ：Template Engine</li><li>2 ：Javascript</li></ul>')
    })

    it('noescape', function() {
      document.body.innerHTML = 
        '<script id="/template/noescape.html" type="template/text">'
        +  '<h1>{{@title}}</h1>'
        +   '<h4>默认 escape = true</h4>'
        +   '<p>{{@noescapeContent}}</p>'
        +   '<h4>不转义</h4>'
        +   '<p>{{#escapeContent}}</p>'
        +   '<h4>强制转义</h4>'
        +   '<p>{{!#escapeContent}}</p>'
        + '</script>'

      var view = oTemplate.renderById('/template/noescape.html', {
        title: 'oTemplate',
        noescapeContent: '<div>\
            Check it out!!!\
            <ul>\
              <li>check</li>\
              <li>check</li>\
              <li>check</li>\
              <li>yoyoyo</li>\
            </ul>\
          </div>',
        escapeContent: '<div>\
            Check it out!!!\
            <ul>\
              <li>check</li>\
              <li>check</li>\
              <li>check</li>\
              <li>yoyoyo</li>\
            </ul>\
          </div>'
      }, {
        escape: true
      })

      expect(view).toEqual('<h1>oTemplate</h1><h4>默认 escape = true</h4><p>&lt;div&gt;            Check it out!!!            &lt;ul&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;yoyoyo&lt;/li&gt;            &lt;/ul&gt;          &lt;/div&gt;</p><h4>不转义</h4><p><div>            Check it out!!!            <ul>              <li>check</li>              <li>check</li>              <li>check</li>              <li>yoyoyo</li>            </ul>          </div></p><h4>强制转义</h4><p>&lt;div&gt;            Check it out!!!            &lt;ul&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;check&lt;/li&gt;              &lt;li&gt;yoyoyo&lt;/li&gt;            &lt;/ul&gt;          &lt;/div&gt;</p>')
    })
  })

  // TODO: error issue should blew.
})