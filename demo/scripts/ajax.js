window.onload = function() {
  oTemplate.renderByAjax('templates/ajax.html', {
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  },
  function(html) {
    document.body.innerHTML = html
  })
}