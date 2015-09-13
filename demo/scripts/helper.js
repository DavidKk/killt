window.onload = function() {
  oTemplate.helper('love', function(who) {
    return /\?/.exec(who) ? 'Fuck Q!!!' : 'Love ' + who
  })

  document.body.innerHTML = oTemplate.renderById('/template/helper.html', {
    title: 'Helper Defination'
  })
}