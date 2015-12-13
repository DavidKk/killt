let fs = require('fs')

/**
 * 读取文件
 * @function
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
function readFile (filename, callback) {
  if (is('Function')(callback)) {
    fs.readFile(filename, function(err, buffer) {
      callback(buffer.toString())
    })
  }
}