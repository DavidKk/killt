var t1 = oTemplate.renderById('oTemplate')
console.log(t1)

var t2 = oTemplate.renderById('oTemplate1', {
  script    : '<script></script>',
  // ascii 16进制
  ascii     : '\x3c\x73\x63\x72\x69\x70\x74\x3e\x3c\x2f\x73\x63\x72\x69\x70\x74\x3e',
  // ios 8859-1
  iso88591  : '&#60;&#115;&#99;&#114;&#105;&#112;&#116;&#62;&#60;&#47;&#115;&#99;&#114;&#105;&#112;&#116;&#62;',
  // base64
  base64    : 'data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==',
})

console.log(t2)
document.body.innerHTML += t2