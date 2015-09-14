window.onload = function() {
  document.body.innerHTML = oTemplate.renderById('/template/noescape.html', {
    title: 'oTemplate',
    content: '<div>\
        Check it out!!!\
        <ul>\
          <li>check</li>\
          <li>check</li>\
          <li>check</li>\
          <li>yoyoyo</li>\
        </ul>\
      </div>'
  })
}