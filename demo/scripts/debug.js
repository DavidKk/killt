window.onload = function() {
  killt.config('env', killt.ENV.UNIT)

  killt.onError(function(error, message) {
    message = killt.helper('$escape')(message)
    document.body.innerHTML += message.replace(/\n/g, '<br>')
  })

  killt.renderById('/template/debug/a.html')
  killt.renderById('/template/debug/b.html')
  killt.renderById('/template/debug/c.html')
  killt.renderById('/template/debug/d.html')
  killt.renderByAjax('/template/debug/e.html', function() {})
  killt.renderByAjax('http://baidu.com', function() {})
}