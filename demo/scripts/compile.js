window.onload = function() {
  var render = oTemplate.compileById('/template/compile.html')

  document.body.innerHTML = render({
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}