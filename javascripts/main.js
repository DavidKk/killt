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
  function render(file) {
    if (views.hasOwnProperty(file)) {
      $('#main-content').html(views[file])
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

        $('#main-content').html(view)
      })
    }
  }


  // Configure
  addRoute('gettingstarted', function() {
    var view
    $('[data-role="nav"][href="#gettingstarted"]')
      .parent()
      .addClass('active')

    render('markdowns/index.md')
  })

  addRoute('examples', function() {
    $('[data-role="nav"][href="#examples"]')
      .parent()
      .addClass('active')

    render('markdowns/examples.md')
  })

  addRoute('docs', function() {
    $('[data-role="nav"][href="#docs"]')
      .parent()
      .addClass('active')

    render('markdowns/docs.md')
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