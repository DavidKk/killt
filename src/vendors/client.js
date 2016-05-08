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
   * @param {Function} callback 回调函数 (optional) - 只有在异步编译才需要/only in async
   * @param {Object} options 配置
   * @return {Function} 模板函数
   */
  compile (template, callback, options = {}) {
    let conf = this.options(options, { filename: template })
    let sync = !!conf.sync

    if (is('Object')(callback)) {
      return this.compile(template, null, callback)
    }

    if (false === sync && !is('Function')(callback)) {
      return
    }

    template = toString(template)

    let render = true === conf.override ? undefined : this._cache(template)

    if (is('Function')(render)) {
      if (sync) {
        return render
      }

      callback(render)
      return
    }

    let node = document.getElementById(template)

    if (node) {
      let source = node.innerHTML.replace(/^ *\n|\n *$/g, '')
      render = this.compileSource(source, conf)
      return sync ? render : (callback(render), undefined)
    }

    this.getSourceByAjax(template, (source) => {
      let [origin, dependencies] = [source, []]

      // source 经过这里会变得不纯正
      // 主要用于确定需要导入的模板
      if (false === conf.noSyntax) {
        source = this.$compileSyntax(source, conf.strict)
      }

      // 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
      forEach(source.split('<%'), (code) => {
        let [codes, match] = [code.split('%>')]

        // logic block is fist part when `codes.length === 2`
        // 逻辑模块
        if (1 !== codes.length
        && (match = /include\s*\(\s*([\w\W]+?)(\s*,\s*([^\)]+)?)?\)/.exec(codes[0]))) {
          dependencies.push(match[1].replace(/[\'\"\`]/g, ''))
        }
      })

      let total = dependencies.length

      let __return = () => {
        render = this.$compile(origin)
        this._cache(template, render)
        false === sync && callback(render)
        total = undefined
      }

      let __exec = () => {
        0 >= -- total && __return()
      }

      if (0 < total) {
        forEach(unique(dependencies), (child) => {
          if (this._cache(child)) {
            __exec()
          }
          else {
            let childSource = findChildTemplate(child, origin)

            if (childSource) {
              this.compileSource(childSource, {
                filename  : child,
                override  : !!conf.override,
              })

              __exec()
            }
            else {
              this.compile(child, __exec, conf)
            }
          }
        })
      }
      else {
        __return()
      }
    },
    {
      sync: sync
    })

    return render

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
   * 渲染模板
   * @param {string} template 模板
   * @param {Object} data 数据
   * @param {Function} callback 回调函数 (optional) - 只有在异步编译才需要/only in async
   * @param {Object} options 配置
   * @return {string} 结果字符串
   */
  render (template, data, callback, options = {}) {
    let conf = this.options(options, { filename: template })
    let sync = !!conf.sync

    if (is('Object')(callback)) {
      let render = this.compile(template, null, extend(callback, { sync: true }))
      return render(data || {})
    }

    if (false === sync && !is('Function')(callback)) {
      return
    }

    this.compile(template, (render) => {
      let source = render(data || {})
      callback(source)
    }, conf)
  }

  /**
   * 阻塞编译模板
   * @param {string} template 模板ID
   * @param {Object} options 配置 (optional)
   * @return {Function} 编译函数
   */
  compileSync (template, options) {
    let conf = extend({}, options, { sync: true })
    return this.compile(template, null, conf)
  }

  /**
   * 阻塞渲染
   * @param {string} template 模板地址或ID
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @return {string} 结果字符串
   */
  renderSync (template, data, options) {
    let render = this.compileSync(template, options)
    return render(data || {})
  }

  /**
   * 异步编译模板
   * @param {string} template 模板地址或ID
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  compileAsync (template, callback, options) {
    let conf = extend({}, options, { sync: false })
    this.compile(template, callback, conf)
  }

  /**
   * 异步渲染
   * @param {string} template 模板地址或ID
   * @param {Object} data 数据 (optional)
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   * @return {string} 结果字符串
   */
  renderAsync (template, data, callback, options) {
    if (is('Function')(data)) {
      return this.renderAsync(template, {}, data, callback)
    }

    if (is('Function')(callback)) {
      this.compileAsync(template, (render) => {
        callback(render(data || {}))
      }, options)
    }
  }

  /**
   * 请求远程模板资源
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   * @param {Object} options 配置
   */
  getSourceByAjax (sourceUrl, callback, options = {}) {
    if (!is('Function')(callback)) {
      return
    }

    let xhr = new XMLHttpRequest()

    xhr.onreadystatechange = function () {
      let status = this.status

      if (this.DONE === this.readyState && 200 <= status && 400 > status) {
        callback(this.responseText)
      }
    }

    xhr.onerror = () => {
      let err = {
        message   : `[Compile Template]: Request file ${sourceUrl} some error occured.`,
        filename  : sourceUrl,
        response  : `[Reponse State]: ${this.status}`
      }

      this._throw(err)
      is('Function')(options.catch) && options.catch(err)
    }

    xhr.ontimeout = () => {
      let err = {
        message   : `[Request Template]: Request template file ${sourceUrl} timeout.`,
        filename  : sourceUrl
      }

      this._throw(err)
      is('Function')(options.catch) && options.catch(err)
    }

    xhr.onabort = () => {
      let err = {
        message   : '[Request Template]: Bowswer absort the request.',
        filename  : sourceUrl
      }

      this._throw(err)
      is('Function')(options.catch) && options.catch(err)
    }

    xhr.open('GET', sourceUrl, !options.sync)
    xhr.send(null)
  }
}

/**
 * Exports Module
 */
umd('oTemplate', function () {
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