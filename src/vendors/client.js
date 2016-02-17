/**
 * 浏览器接口类
 * @class
 * @param {Object} options 配置
 * @param {string} options.env [unit, develop, produce]
 * @param {boolean} options.noSyntax 是否使用使用原生语法
 * @param {boolean} options.strict 是否通过严格模式编译语法
 * @param {boolean} options.compress 压缩生成的HTML代码
 * @param {string} options.openTag 语法的起始标识
 * @param {string} options.closeTag 语法的结束标识
 * @param {Array} options.depends 追加渲染器的传值设定
 */
class Client extends Bone {
  constructor () {
    let self = this
    Bone.apply(this, arguments)

    // extends include func to support ajax request file
    // 扩展新的 include 支持 ajax
    ~extend(this._helpers, {
      include: function(filename, data, options) {
        return self.renderById(filename, data, options)
      }
    })
  }

  /**
   * 编译内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} options 配置 (optional)
   * @returns {Function} 编译函数
   */
  compileById (templateId, options = {}) {
    templateId = toString(templateId)

    let conf   = extend({}, this.DEFAULTS, options, { filename: templateId }),
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
  }

  /**
   * 渲染内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @returns {string} 内容
   */
  renderById (templateId, data = {}, options = {}) {
    let render = this.compileById(templateId, options)
    return render(data)
  }

  /**
   * 编译远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  compileByAjax (sourceUrl, callback, options = {}) {
    if (!is('Function')(callback)) {
      return
    }

    let self   = this,
        conf   = extend({}, this.DEFAULTS, options),
        render = true === conf.override || this._cache(sourceUrl)

    if (is('Function')(render)) {
      callback(render)
    }
    else {
      this.getSourceByAjax(sourceUrl, function (source) {
        let [origin, dependencies] = [source, []]

        // source 经过这里会变得不纯正
        // 主要用于确定需要导入的模板
        if (false === conf.noSyntax) {
          source = self.$compileSyntax(source, conf.strict)
        }

        // 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
        forEach(source.split('<%'), function(code) {
          let [codes, match] = [code.split('%>')]

          // logic block is fist part when `codes.length === 2`
          // 逻辑模块
          if (1 !== codes.length
          && (match = /include\s*\(\s*([\w\W]+?)(\s*,\s*([^\)]+)?)?\)/.exec(codes[0]))) {
            dependencies.push(match[1].replace(/[\'\"\`]/g, ''))
          }
        })

        let total = dependencies.length
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
          forEach(unique(dependencies), function (file) {
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
  }

  /**
   * 渲染远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Object} data 数据 (optional)
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  renderByAjax (sourceUrl, data, callback, options = {}) {
    if (is('Function')(data)) {
      return this.renderByAjax(sourceUrl, {}, data, callback)
    }

    if (is('Function')(callback)) {
      this.compileByAjax(sourceUrl, function(render) {
        callback(render(data || {}))
      }, options)
    }
  }

  /**
   * 请求远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   */
  getSourceByAjax (sourceUrl, callback, errorCallback) {
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
  }
}

/**
 * Exports Module
 */
UMD('oTemplate', function() {
  return new Client()
}, root)

/**
 * UMD 模块定义
 * @function
 * @param {windows|global} root
 * @param {Function} factory
 */
function UMD (name, factory, root) {
  let [define, module] = [root.define, factory(root)]

  // AMD & CMD
  if (is('Function')(define)) {
    define(function () {
      return module
    })
  }
  // no module definaction
  else {
    root[name] = module
  }
}