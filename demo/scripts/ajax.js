window.onload = function() {
  killt.renderByAjax('/killt/demo/templates/ajax.html', {
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  },
  function(html) {
    document.body.innerHTML = html
  })
}