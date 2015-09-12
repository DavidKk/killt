!(function() {
  // Helpers
  var routes = {}
  function addRoute(name, handle) {
    if ($.isFunction(handle)) {
      routes[name] = handle
    }
  }

  function digest() {
    var route = window.location.hash.replace('#', '')
    $.each(routes, function(name, handle) {
      name === route && handle()
    })
  }

  var views = {}
  function render(file, container) {
    if (views.hasOwnProperty(file)) {
      $(container).html(views[file])
    }
    else {
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
      })
    }
  }

  // Configure
  addRoute('gettingstarted', function() {
    var $con = $('#index-container')
    $('[data-role="nav"][href="#gettingstarted"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/index.md', $con.data('render', true).show())
  })

  addRoute('examples', function() {
    var $con = $('#examples-container')
    $('[data-role="nav"][href="#examples"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/examples.md', $con.data('render', true).show())
  })

  addRoute('docs', function() {
    var $con = $('#docs-container')
    $('[data-role="nav"][href="#docs"]')
      .parent()
      .addClass('active')

    $('.module-container').hide()

    $con.data('render')
      ? $con.show()
      : render('markdowns/docs.md', $con.data('render', true).show())
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