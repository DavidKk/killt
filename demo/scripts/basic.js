window.onload = function() {
  document.body.innerHTML = oTemplate.renderById('/template/basic.html', {
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}