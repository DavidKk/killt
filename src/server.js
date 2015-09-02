var fs = require('fs')

function readFile(filename, callback, sync) {
  sync = isBoolean(sync) ? sync : false

  if (isFunction(callback)) {
    fs.readFile(filename, function(err, buffer) {
      callback(buffer.toString())
    })
  }
}