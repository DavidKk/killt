window.onload = function() {
  document.body.innerHTML = oTemplate.renderById('/template/include.html', {
    title: 'oTemplate',
    subTitle: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}