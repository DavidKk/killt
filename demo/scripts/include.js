window.onload = function() {
  document.body.innerHTML = killt.renderById('/template/include.html', {
    title: 'killt',
    subTitle: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}