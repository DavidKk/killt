'use strict'

const killt = require('./dist/es5/server/killt.js')

killt.render('./template/b.html', {}, function (source) {
  console.log(source)
})
