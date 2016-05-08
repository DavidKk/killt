window.onload = function() {
  var render = killt.compileById('/template/compile.html')

  document.body.innerHTML = render({
    title: 'Keywords',
    list: ['Template', 'Template Engine', 'Javascript']
  })
}