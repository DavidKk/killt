const fs = require('fs')

/**
 * 服务器接口类
 * @class
 */
class Server extends (Syntax || Engine) {
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
   * 读取文件
   * @function
   * @param {string} filename 文件名
   * @param {Object} options 配置
   * @return {Promise}
   */
  readFile (filename, options = {}) {
    return new Promise((reolve, reject) => {
      fs.readFile(filename, options.encoding || 'utf-8', (err, buffer) => {
        if (err) {
          let error = {
            message   : `[Compile Template]: Read file ${filename} some error occured.`,
            filename  : filename,
            origin    : err
          }

          this._throw(error)
          reject(error)
          return
        }

        let source = buffer.toString('utf-8')
        reolve(source)
      })
    })
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

    this
    .readFile(template)
    .then((source) => {
      /**
       * source will become not pure
       * so we must save the source at first
       * source 会受影响，因此先保存 source 的初始值
       */
      let dependencies = []
      let origin       = source

      /**
       * because can not make sure which syntax will be used
       * so compile it to lit version syntax
       * 因此不能确认使用那种语法，因此先编译成原始版本语法
       */
      if (false === conf.noSyntax) {
        source = this.$compileSyntax(source, conf.strict)
      }

      /**
       * find out all dependencies of this template
       * match any `<%# include template [, data] %>` syntax
       * 找出所有依赖模板
       * 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
       */
      forEach(source.split('<%'), (code) => {
        let [codes, match] = [code.split('%>')]

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
            let promise = new Promise((resolve, reject) => {
              this.compile(dependency, (err, render) => {
                err ? reject(err) : resolve(render)
              }, options)
            })

            promises.push(promise)
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
    })
    .catch((err) => {
      callback(err)
    })
  }

  /**
   * 渲染模板
   * @param {string} template 模板
   * @param {Object} data 数据
   * @param {function} callback 回调
   * @param {Object} options 配置
   */
  render (template, data, callback, options) {
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
   * 同步读取文件
   * @function
   * @param {string} filename 文件名
   * @param {Object} options 配置
   * @return {string} 模板
   */
  readFileSync (filename, options = {}) {
    try {
      let buffer = fs.readFileSync(filename, options.encoding || 'utf-8')
      let source = buffer.toString('utf-8')
      return source
    }
    catch (err) {
      let error = {
        message   : `[Compile Template]: Read file (sync) ${filename} some error occured.`,
        filename  : filename,
        origin    : err
      }

      this._throw(error)
    }
  }

  /**
   * 阻塞编译模板
   * @param {string} template 模板ID
   * @param {Object} options 配置 (optional)
   * @return {Function} 模板函数
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
     * read template by ajax sync
     * if error return __render (return empty string)
     * 同步查找模板文件，若失败则返回 __render (该函数返回空字符串)
     */
    let source = this.readFileSync(template, options)
    if (is('Undefined')(source)) {
      return __render
    }

    /**
     * source will become not pure
     * so we must save the source at first
     * source 会受影响，因此先保存 source 的初始值
     */
    let dependencies = []
    let origin       = source

    /**
     * because can not make sure which syntax will be used
     * so compile it to lit version syntax
     * 因此不能确认使用那种语法，因此先编译成原始版本语法
     */
    if (false === conf.noSyntax) {
      source = this.$compileSyntax(source, conf.strict)
    }

    /**
     * find out all dependencies of this template
     * match any `<%# include template [, data] %>` syntax
     * 找出所有依赖模板
     * 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
     */
    forEach(source.split('<%'), (code) => {
      let [codes, match] = [code.split('%>')]

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
}

module.exports = new Server()