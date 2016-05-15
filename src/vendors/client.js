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
class Client extends (Syntax || Engine) {
  constructor (options) {
    super(options)

    // extends include func to support ajax request file
    // 扩展新的 include 支持 ajax
    ~extend(this._helpers, {
      include: (filename, data, options) => {
        return this.renderSync(filename, data, options)
      }
    })
  }

  /**
   * 编译模板
   * @param {string} source 模板
   * @param {Object} options 配置
   * @returns {Function} 模板函数
   * @description
   * 当渲染器已经被缓存的情况下，options 除 override 外的所有属性均不会
   * 对渲染器造成任何修改；当 override 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  compileSource (source, options) {
    return super.compile.call(this, source, options)
  }

  /**
   * 渲染模板
   * @param {string} source 模板
   * @param {Object} data 数据
   * @param {Object} options 配置
   * @returns {string} 结果字符串
   * @description
   * 当渲染器已经被缓存的情况下，options 除 override 外的所有属性均不会
   * 对渲染器造成任何修改；当 override 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  renderSource (source, data, options) {
    return super.render.call(this, source, data, options)
  }

  /**
   * 编译模板
   * @param {string} template 模板
   * @param {Function} callback 回调函数
   * @param {Object} options 配置
   * @description
   * Progress:
   * find includes -> load include -> compile -> not found includes -> cache -> render template
   *                                          -> find includes      -> ...
   */
  compile (template, callback, options = {}) {
    template = toString(template)

    let conf = this.options(options, { filename: template })

    /**
     * find out render function in the caches
     * 找出缓存中是否存在模板函数
     */
    let render = true === conf.override ? undefined : this._cache(template)
    if (is('Function')(render)) {
      callback(null, render)
      return
    }

    /**
     * if template in document, use innerHTML as source
     * 查找模板是否存在 document 当中，若存在则直接使用不用请求远程模板
     */
    let node = document.getElementById(template)
    if (node) {
      let source = node.innerHTML.replace(/^ *\n|\n *$/g, '')
      render = this.compileSource(source, conf)
      callback(null, render)
      return
    }

    this.readFileByAJAX(template, (err, source) => {
      if (err) {
        callback(err)
        return
      }

      /**
       * source will become not pure
       * so we must save the source at first
       * source 会受影响，因此先保存 source 的初始值
       */
      let dependencies  = []
      let origin        = source
      let openTag       = '<%'
      let closeTag      = '%>'

      if (false === conf.noSyntax) {
        openTag   = conf.openTag
        closeTag  = conf.closeTag
      }

      /**
       * find out all dependencies of this template
       * match any `<%# include template [, data] %>` syntax
       * 找出所有依赖模板
       * 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
       */
      forEach(source.split(openTag), (code) => {
        let [codes, match] = [code.split(closeTag)]

        if (1 !== codes.length
        && (match = /include\s*\(\s*([\w\W]+?)(\s*,\s*([^\)]+)?)?\)/.exec(codes[0]))) {
          dependencies.push(match[1].replace(/[\'\"\`]/g, ''))
        }
      })

      // compile all dependencies
      // 编译所有的子模板
      if (0 < dependencies.length) {
        let promises = []

        forEach(dependencies, (dependency) => {
          // check if dependency is already exists
          // 检测子模板是否已经存在
          if (!this._cache(dependency)) {
            // check if dependency is in current template
            // 检测子模板是否存在当前模板中，若是则直使用
            let subSource = findChildTemplate(dependency, origin)
            if (is('Defined')(subSource)) {
              this.compileSource(subSource, {
                filename  : dependency,
                override  : !!conf.override,
              })
            }
            // require source in loop
            else {
              let promise = new Promise((resolve, reject) => {
                this.compile(dependency, (err, render) => {
                  err ? reject(err) : resolve(render)
                }, conf)
              })

              promises.push(promise)
            }
          }
        })

        /**
         * all sub-template is ready
         * compile current template
         * and fire callback
         */
        if (0 < promises.length) {
          Promise
          .all(promises)
          .then(() => {
            let render = this.$compile(origin)
            this._cache(template, render)

            callback(null, render)
          })
          .catch((err) => {
            callback(err)
          })
        }
        else {
          let render = this.$compile(origin)
          this._cache(template, render)

          callback(null, render)
        }
      }
      // not found any dependencies and compile this template
      // 找不到任何子模板直接编译模板
      else {
        let render = this.$compile(origin)
        this._cache(template, render)

        callback(null, render)
      }
    }, extend(conf, { sync: false }))
  }

  /**
   * 渲染模板
   * @param {string} template 模板
   * @param {Object} data 数据
   * @param {function} callback 回调
   * @param {Object} options 配置
   */
  render (template, data, callback, options = {}) {
    if (is('Function')(data)) {
      this.render(template, {}, data, callback)
    }
    else if (is('Function')(callback)) {
      this.compile(template, (error, render) => {
        callback(error, render(data || {}))
      }, options)
    }
  }

  /**
   * 阻塞编译模板
   * @param {string} template 模板ID
   * @param {Object} options 配置 (optional)
   * @return {Function} 编译函数
   * @description
   * Progress:
   * find includes -> load include -> compile -> not found includes -> cache -> render template
   *                                          -> find includes      -> ...
   */
  compileSync (template, options = {}) {
    template = toString(template)

    let conf = this.options(options, { filename: template })

    /**
     * find out render function in the caches
     * 找出缓存中是否存在模板函数
     */
    let render = true === conf.override ? undefined : this._cache(template)
    if (is('Function')(render)) {
      return render
    }

    /**
     * if template in document, use innerHTML as source
     * 查找模板是否存在 document 当中，若存在则直接使用不用请求远程模板
     */
    let node = document.getElementById(template)
    if (node) {
      let source = node.innerHTML.replace(/^ *\n|\n *$/g, '')
      return this.compileSource(source, conf)
    }

    /**
     * read template by ajax sync
     * if error return __render (return empty string)
     * 同步查找模板文件，若失败则返回 __render (该函数返回空字符串)
     */
    let source = this.readFileByAJAX(template, null, extend(conf, { sync: false }))
    if (is('Undefined')(source)) {
      return __render
    }

    /**
     * source will become not pure
     * so we must save the source at first
     * source 会受影响，因此先保存 source 的初始值
     */
    let dependencies  = []
    let origin        = source
    let openTag       = '<%'
    let closeTag      = '%>'

    if (false === conf.noSyntax) {
      openTag   = conf.openTag
      closeTag  = conf.closeTag
    }

    /**
     * find out all dependencies of this template
     * match any `<%# include template [, data] %>` syntax
     * 找出所有依赖模板
     * 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
     */
    forEach(source.split(openTag), (code) => {
      let [codes, match] = [code.split(closeTag)]

      if (1 !== codes.length
      && (match = /include\s*\(\s*([\w\W]+?)(\s*,\s*([^\)]+)?)?\)/.exec(codes[0]))) {
        dependencies.push(match[1].replace(/[\'\"\`]/g, ''))
      }
    })

    // compile all dependencies
    // 编译所有的子模板
    if (0 < dependencies.length) {
      forEach(dependencies, (dependency) => {
        // check if dependency is already exists
        // 检测子模板是否已经存在
        if (!this._cache(dependency)) {
          this.compileSync(dependency, options)
        }
      })
    }

    render = this.$compile(origin)
    this._cache(template, render)
    return render
  }

  /**
   * 阻塞渲染
   * @param {string} template 模板地址或ID
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @return {string} 结果字符串
   */
  renderSync (template, data = {}, options) {
    let render = this.compileSync(template, options)
    return render(data)
  }

  /**
   * 请求远程模板资源
   * @param {string} url 远程资源地址
   * @param {Function} callback 回调函数
   * @param {Object} options 配置
   * @return {string} 模板
   */
  readFileByAJAX (url, callback, options = {}) {
    if (!is('Function')(callback)) {
      callback = function () {}
    }

    let xhr = new XMLHttpRequest()
    let responseText

    xhr.onreadystatechange = function () {
      let status = this.status

      if (this.DONE === this.readyState && 200 <= status && 400 > status) {
        responseText = this.responseText
        callback(null, this.responseText)
      }
    }

    xhr.onerror = () => {
      let err = {
        message   : `[Compile Template]: Request file ${url} some error occured.`,
        filename  : url,
        response  : `[Reponse State]: ${this.status}`,
      }

      this._throw(err)
      callback(err)
    }

    xhr.ontimeout = () => {
      let err = {
        message   : `[Request Template]: Request template file ${url} timeout.`,
        filename  : url,
      }

      this._throw(err)
      callback(err)
    }

    xhr.onabort = () => {
      let err = {
        message   : '[Request Template]: Bowswer absort the request.',
        filename  : url,
      }

      this._throw(err)
      callback(err)
    }

    xhr.open('GET', url, !options.sync)
    xhr.send(null)
    return responseText
  }
}

/**
 * Exports Module
 */
umd('killt', function () {
  return new Client()
}, root)

/**
 * umd 模块定
 * @param {string} name 名称
 * @param {function} factory 工厂
 * @param {windows|global} root 当前域
 */
function umd (name, factory, root) {
  let [define, module] = [root.define, factory(root)]

  // AMD & CMD
  if (is('Function')(define)) {
    define(() => {
      return module
    })
  }
  // no module definaction
  else {
    root[name] = module
  }
}

/**
 * 查找子模板
 * 在模板中查找是否含有另外的模板
 * @param  {string} templateId 对应的模板ID
 * @param  {string} source     需要查找模板
 * @return {string}            结果模板
 */
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