let fs = require('fs')

/**
 * 服务器接口类
 * @class
 */
class Server extends Bone {
  /**
   * 读取文件
   * @function
   * @param  {String}   filename 文件名
   * @param  {Function} callback 回调函数
   */
  readFile (filename, callback) {
    if (is('Function')(callback)) {
      fs.readFile(filename, function(err, buffer) {
        callback(buffer.toString())
      })
    }
  }
}

module.exports = function() {
  return new Server()
}