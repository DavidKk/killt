window.onload = function() {
  oTemplate.renderById('/template/debug/a.html')
  oTemplate.renderById('/template/debug/b.html')
  oTemplate.renderById('/template/debug/c.html')
  oTemplate.renderById('/template/debug/d.html')
  oTemplate.renderByAjax('/template/debug/e.html', function() {})
}