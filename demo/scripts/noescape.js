window.onload = function() {
  document.body.innerHTML = oTemplate.renderById('/template/noescape.html', {
    title: 'oTemplate',
    noescapeContent: '<div>\
        Check it out!!!\
        <ul>\
          <li>check</li>\
          <li>check</li>\
          <li>check</li>\
          <li>yoyoyo</li>\
        </ul>\
      </div>',
    escapeContent: '<div>\
        Check it out!!!\
        <ul>\
          <li>check</li>\
          <li>check</li>\
          <li>check</li>\
          <li>yoyoyo</li>\
        </ul>\
      </div>'
  }, {
    escape: true
  })
}