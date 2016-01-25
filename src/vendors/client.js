/**
 * 扩展新的 include 支持 ajax
 */
Bone.extend(function() {
  let self = this

  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return self.renderById(filename, data, options)
    }
  })
})

~extend(Bone.prototype, {
  /**
   * 编译内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} options 配置 (optional)
   * @returns {Function} 编译函数
   */
  compileById: function(templateId, options = {}) {
    templateId = toString(templateId)

    let conf   = extend({}, this._defaults, options, { filename: templateId }),
        render = true === conf.override || this._cache(templateId)

    if (is('Function')(render)) {
      return render
    }

    let node = document.getElementById(templateId)

    return node
      ? this.compile(node.innerHTML, conf)
      : (this._throw({
          message: `[Compile Template]: Template ID ${templateId} is not found.`
        }),
        __render)
  },

  /**
   * 渲染内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @returns {string} 内容
   */
  renderById: function(templateId, data = {}, options = {}) {
    let render = this.compileById(templateId, options = {})
    return render(data)
  },

  /**
   * 编译远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  compileByAjax: function(sourceUrl, callback, options = {}) {
    if (!is('Function')(callback)) {
      return
    }

    let self   = this,
        conf   = extend({}, this._defaults, options),
        render = true === conf.override || this._cache(sourceUrl)

    if (is('Function')(render)) {
      callback(render)
    }
    else {
      this.getSourceByAjax(sourceUrl, function (source) {
        source = self.$compileSyntax(source, !!conf.strict)

        let [origin, requires, match] = [source, []]
        while (match = /<%!?#?\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")(\s*,\s*([^\)]+)?)?\)%>/.exec(source)) {
          requires.push(match[3])
          source = source.replace(match[0], '')
        }

        let total = requires.length
        let __exec = function () {
          0 >= (-- total) && __return()
        }

        let __return = function () {
          render = self.$compile(origin)
          self._cache(sourceUrl, render)
          callback(render)
          total = undefined
        }

        if (total > 0) {
          forEach(unique(requires), function (file) {
            if (self._cache(file)) {
              __exec()
            }
            else {
              let childSource = findChildTemplate(file, origin)

              if (childSource) {
                self.compile(childSource, {
                  filename: file,
                  override: !!conf.override
                })

                __exec()
              }
              else {
                let node = document.getElementById(file)

                if (node) {
                  self.compile(node.innerHTML, {
                    filename: file,
                    override: !!conf.override
                  })

                  __exec()
                }
                else {
                  self.compileByAjax(file, __exec, extend(conf, {
                    override: !!conf.override
                  }))
                }
              }
            }
          })
        }
        else {
          __return()
        }
      })
    }

    function findChildTemplate (templateId, source) {
      let node = document.createElement('div')
      node.innerHTML = source

      let templateNodes = node.getElementsByTagName('script')
      for (let i = templateNodes.length; i --;) {
        if (templateId === templateNodes[i].id) {
          return templateNodes[i].innerHTML
        }
      }
    }
  },

  /**
   * 渲染远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Object} data 数据 (optional)
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  renderByAjax: function(sourceUrl, data, callback, options = {}) {
    if (is('Function')(data)) {
      return this.renderByAjax(sourceUrl, {}, data, callback)
    }

    if (is('Function')(callback)) {
      this.compileByAjax(sourceUrl, function(render) {
        callback(render(data || {}))
      }, options)
    }
  },

  /**
   * 请求远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   */
  getSourceByAjax: function(sourceUrl, callback, errorCallback) {
    if (!is('Function')(callback)) {
      return
    }

    let [self, xhr] = [this, new XMLHttpRequest]

    xhr.onreadystatechange = function() {
      let status = this.status
      if (this.DONE === this.readyState) {
        200 <= status && status < 400 && callback(this.responseText)
      }
    }

    xhr.onerror = function() {
      let err = {
        message   : `[Compile Template]: Request file ${sourceUrl} some error occured.`,
        filename  : sourceUrl,
        response  : `[Reponse State]: ${this.status}`
      }

      self._throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.ontimeout = function() {
      let err = {
        message   : `[Request Template]: Request template file ${sourceUrl} timeout.`,
        filename  : sourceUrl
      }

      self._throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.onabort = function() {
      let err = {
        message   : `[Request Template]: Bowswer absort the request.`,
        filename  : sourceUrl
      }

      self._throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.open('GET', sourceUrl, true)
    xhr.send(null)
  },
})