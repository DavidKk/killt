window.onload = function() {
  document.body.innerHTML = killt.renderById('/template/noescape.html', {
    title: 'killt',
    noescapeContent: [
        '<div>',
        '   Check it out!!!',
        '   <ul>',
        '     <li>check</li>',
        '     <li>check</li>',
        '     <li>check</li>',
        '     <li>yoyoyo</li>',
        '   </ul>',
        '</div>'
      ].join('\n'),
    escapeContent: [
        '<div>',
        '   Check it out!!!',
        '   <ul>',
        '     <li>check</li>',
        '     <li>check</li>',
        '     <li>check</li>',
        '     <li>yoyoyo</li>',
        '   </ul>',
        '</div>'
      ].join('\n')
  }, {
    escape: true
  })
}