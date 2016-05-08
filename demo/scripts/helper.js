window.onload = function() {
  killt.helper('love', function(who) {
    return /\?/.exec(who) ? 'Fuck Q!!!' : 'Love ' + who
  })

  document.body.innerHTML = killt.renderById('/template/helper.html', {
    title: 'Helper Defination'
  })
}