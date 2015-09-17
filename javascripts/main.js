!(function() {
  // Helpers
  var routes = {},
      readyHandle = []
  function addRoute(name, handle) {
    if ($.isFunction(handle)) {
      routes[name] = handle
    }
  }

  function ready(callback) {
    $.isFunction(callback) && readyHandle.push(callback)
  }

  function digest() {
    var route = window.location.hash.replace('#', '')
    $.each(routes, function(name, handle) {
      name === route && handle(function() {
        $.each(readyHandle, function(k, func) {
          func()
        })
      })
    })
  }

  var views = {}
  function render(file, container, callback) {
    if (views.hasOwnProperty(file)) {
      $(container).html(views[file])
      $.isFunction(callback) && callback()
    }
    else {
      var match = /\.[\w]+$/.exec(file),
          extname = match[0] || 'html'

      if ('.md' === extname) {
        $.get(file)
        .success(function(tpl) {
          var view = views[file] = marked(tpl, {
            highlight: function(code, lang) {
              try {
                return hljs.highlight(lang, code).value
              }
              catch(e) {
                return hljs.highlightAuto(code).value
              }
            }
          })

          $(container).html(view)
          $.isFunction(callback) && callback()
        })
      }
      else if ('.html' === extname) {
        oTemplate.renderByAjax(file, function(view) {
          $(container).html(view)
          $.isFunction(callback) && callback()
        })
      }
    }
  }

  // Configure
  addRoute('gettingstarted', function(callback) {
    var $con = $('#index-container')
    $('[data-role="nav"][href="#gettingstarted"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/index.md', $con.data('render', true).show(), callback)
  })

  addRoute('examples', function(callback) {
    var $con = $('#examples-container')
    $('[data-role="nav"][href="#examples"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/examples.md', $con.data('render', true).show(), callback)
  })

  addRoute('docs', function(callback) {
    var $con = $('#docs-container')
    $('[data-role="nav"][href="#docs"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/docs.md', $con.data('render', true).show(), callback)
  })

  ready(function() {
    $('iframe').each(function() {
      var $this = $(this)

      this.onload = function() {
        var $inner = $(this.contentWindow)
        $this.height($inner.height())
      }

      $this.attr('src', $this.data('src'))
    })
  })

  // Ready
  $(document)
  .ready(function() {
    var loc = window.location,
        route = loc.hash.replace(/^#*([\w]+?)/, '$1')

    if (!routes.hasOwnProperty(route)) {
      loc.hash = Object.keys(routes)[0]
    }

    digest()
  })
  // Events
  .on('click', '[data-role="nav"]', function() {
    var $this = $(this),
        href = $this.attr('href')

    $('[data-role="nav"]')
    .not(this)
    .each(function() {
      $(this).parent().removeClass('active')
    })

    setTimeout(digest)
  })

})();