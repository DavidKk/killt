/**
 * @function compileById 编译内联模板
 * @param  {String} id      模板ID
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compileById = function(id, options) {
  id = id.toString()

  var conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(id)

  if (isFunction(render)) {
    return render
  }

  var node = document.getElementById(id)
  return node
    ? this.compile(node.innerHTML, { filename: id }, conf)
    : __throw({ message: '[Compile Template]: Template ID `' + id + '` is not found.' }) || __render
}

/**
 * @function renderById 渲染内联模板
 * @param  {String} id      模板ID
 * @param  {Object} data    数据
 * @param  {Object} options 配置
 * @return {String}
 */
OTemplate.prototype.renderById = function(id, data, options) {
  var render = this.compileById(id, options)
  return render(data || {})
}

/**
 * @function compileByAjax 编译模板文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 *   @param {Function} render  渲染函数
 * @param  {Object}   options  配置
 */
OTemplate.prototype.compileByAjax = function(filename, callback, options) {
  if (!isFunction(callback)) {
    return
  }

  var self = this,
      conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(filename)

  isFunction(render)
    ? callback(render)
    : this.readFile(filename, function(source) {
        var _source = source,
            requires = [],
            match

        while(match = /<%\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")((,\s*([\w]+|\{[\w\W]+\})\s*)*)\s*\)\s*%>/.exec(_source)) {
          requires.push(match[3])
          _source = _source.replace(match[0], '')
        }

        var total = requires.length
        var __exec = function() {
          0 >= (-- total) && __return()
        }

        var __return = function() {
          render = self.$compile(source)
          self.$$cache(filename, render)
          callback(render)
          total = undefined
        }

        if (total > 0) {
          forEach(unique(requires), function(file) {
            self.$$cache(file)
              ? __exec()
              : self.compileByAjax(file, __exec, extend(conf, { overwrite: false }))
          })
        }
        else {
          __return()
        }
      })
}

/**
 * @function renderByAjax 渲染模板文件
 * @param  {String}   filename 文件名
 * @param  {Object}   data     数据
 * @param  {Function} callback 回调函数
 *   @param {String} html 渲染结果HTML
 * @param  {Object}   options  配置
 */
OTemplate.prototype.renderByAjax = function(filename, data, callback, options) {
  if (isFunction(data)) {
    return this.renderByAjax(filename, {}, data, callback)
  }

  isFunction(callback) && this.compileByAjax(filename, function(render) {
    callback(render(data || {}))
  }, options)
}

/**
 * @function readFile 读取文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
OTemplate.prototype.readFile = function(filename, callback, errorCallback) {
  if (!isFunction(callback)) {
    return
  }

  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    var status = this.status
    if (this.DONE === this.readyState) {
      200 <= status && status < 400
      ? callback(this.responseText)
      : __throw({ message: '[Compile Template]: Template File `' + filename + '` is not found. \n[Response Status]: ' + status })
    }
  }

  xhr.onerror = xhr.ontimeout = xhr.onabort = function() {
    __throw({ message: '[Compile Template]: Request file `' + filename + '` occur any error.' })
    isFunction(errorCallback) && errorCallback()
  }

  xhr.open('GET', filename, true)
  xhr.send(null)
}
