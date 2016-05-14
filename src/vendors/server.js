const path  = require('path')
const fs    = require('fs')

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
   * @param {Function} callback 回调函数
   * @param {Object} options 配置
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
   * @return {Function} 模板函数
   * @description
   * Progress:
   * find includes -> load include -> compile -> not found includes -> cache -> render template
   *                                          -> find includes      -> ...
   */
  compile (template, callback, options = {}) {
    let conf = this.options(options, { filename: template })

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
      if (dependencies.length > 0) {
        let promises = []

        forEach(dependencies, (dependency) => {
          // check if dependency is already exists
          // 检测子模板是否已经存在
          if (!this._cache(dependency)) {
            let promise = new Promise((resolve, reject) => {
              this.compile(dependency, (err, render) => {
                err ? reject(err) : resolve(render)
              }, options)

              promises.push(promise)
            })
          }
        })

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
   * @param {Function} callback 回调函数 (optional) - 只有在异步编译才需要/only in async
   * @param {Object} options 配置
   * @return {string} 结果字符串
   */
  render (template, data = {}, callback, options = {}) {
    let render = this.compile(template, (err, render) => {
      !err && render(data)
    }, options)
  }

  /**
   * 同步读取文件
   * @function
   * @param {string} filename 文件名
   * @param {Object} options 配置
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
   * @return {Function} 编译函数
   */
  compileSync (template, options = {}) {
    let conf = this.options(options, { filename: template })
    let render = true === conf.override ? undefined : this._cache(template)
    if (is('Function')(render)) {
      return render
    }

    let source = this.readFileSync(template, options)

    /**
     * source will become not pure
     * so we must save the source at first
     * source 会受影响，因此先保存 source 的初始值
     */
    let dependencies = []
    let origin       = source

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

    if (dependencies.length > 0) {
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
  renderSync (template, data = {}, options = {}) {
    let render = this.compileSync(template, options)
    return render(data)
  }
}

module.exports = new Server()