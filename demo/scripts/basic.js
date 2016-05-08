window.onload = function() {
  document.body.innerHTML = killt.renderById('/template/basic.html', {
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}