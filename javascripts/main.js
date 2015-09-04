!(function() {
  // Configure
  var routes = {}
  addRoute('gettingstarted', function() {
    $('[data-role="nav"][href="#gettingstarted"]')
      .parent()
      .addClass('active')

    var view = oTemplate.renderTpl('templates/index.html')
    $('#main-content').html(view)
  })

  addRoute('example', function() {
    $('[data-role="nav"][href="#example"]')
      .parent()
      .addClass('active')

    var view = oTemplate.renderTpl('templates/example.html')
    $('#main-content').html(view)
  })

  addRoute('docs', function() {
    $('[data-role="nav"][href="#docs"]')
      .parent()
      .addClass('active')

    var view = oTemplate.renderTpl('templates/docs.html')
    $('#main-content').html(view)
  })

  // Ready
  $(document)
  .ready(function() {
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

  // Helpers
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
})();