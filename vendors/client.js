// 扩展新的 include 支持 ajax
OTemplate.extend(function() {
  var self = this

  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return self.renderById(filename, data, options)
    }
  })
})

/**
 * @function compileById 编译内联模板
 * @param  {String} id      模板ID
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compileById = function(id, options) {
  id = id.toString()

  var conf = extend({}, this._defaults, options, { filename: id }),
      render = true === conf.overwrite || this.$$cache(id)

  if (is('Function')(render)) {
    return render
  }

  var node = document.getElementById(id)
  return node
    ? this.compile(node.innerHTML, conf)
    : (this.$$throw({
        message: '[Compile Template]: Template ID `' + id + '` is not found.'
      }),
      __render)
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
  if (!is('Function')(callback)) {
    return
  }

  var self = this,
      conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(filename)

  is('Function')(render)
    ? callback(render)
    : this.readFile(filename, function(source) {
        source = self.$compileSyntax(source, !!conf.strict)

        var origin = source,
            requires = [],
            match

        while(match = /<%!?#?\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")(\s*,\s*([^\)]+)?)\)%>/.exec(source)) {
          requires.push(match[3])
          source = source.replace(match[0], '')
        }

        var total = requires.length
        var __exec = function() {
          0 >= (-- total) && __return()
        }

        var __return = function() {
          render = self.$compile(origin)
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
  if (is('Function')(data)) {
    return this.renderByAjax(filename, {}, data, callback)
  }

  is('Function')(callback) && this.compileByAjax(filename, function(render) {
    callback(render(data || {}))
  }, options)
}

/**
 * @function readFile 读取文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
OTemplate.prototype.readFile = function(filename, callback, errorCallback) {
  if (!is('Function')(callback)) {
    return
  }

  var self = this,
      xhr = new XMLHttpRequest()

  xhr.onreadystatechange = function() {
    var status = this.status
    if (this.DONE === this.readyState) {
      200 <= status && status < 400 && callback(this.responseText)
    }
  }

  xhr.onerror = function() {
    var err = {
      message: '[Compile Template]: Request file `' + filename + '` some error occured.',
      filename: filename,
      response: '[Reponse State]: ' + this.status
    }

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.ontimeout = function() {
    var err = {
      message: '[Request Template]: Request template file `' + filename + '` timeout.',
      filename: filename
    }

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.onabort = function() {
    var err = {
      message: '[Request Template]: Bowswer absort the request.',
      filename: filename
    }

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.open('GET', filename, true)
  xhr.send(null)
}
