'use strict'

const killt = require('./dist/es5/server/killt.js')

killt.compile('./template/a.html', function (err, render) {
  if (err) {
    console.log(err)
  }

  console.log(render())
})