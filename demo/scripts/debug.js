window.onload = function() {
  oTemplate.config('env', oTemplate.ENV.UNIT)

  oTemplate.onError(function(error, message) {
    console.log(arguments)
    message = oTemplate.helper('$escape')(message)
    document.body.innerHTML += message.replace(/\n/g, '<br>')
    console.log && console.log(message)
  })

  oTemplate.renderById('/template/debug/a.html')
  oTemplate.renderById('/template/debug/b.html')
  oTemplate.renderById('/template/debug/c.html')
  oTemplate.renderById('/template/debug/d.html')
  oTemplate.renderByAjax('/template/debug/e.html', function() {})
  oTemplate.renderByAjax('http://baidu.com', function() {})
}