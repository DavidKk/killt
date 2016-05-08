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
class Client extends Syntax {
  constructor () {
    super()

    // extends include func to support ajax request file
    // 扩展新的 include 支持 ajax
    ~extend(this._helpers, {
      include (filename: string, data: Object, options: Object) {
        return this.renderSync(filename, data, options)
      }
    })
  }

  /**
   * 编译模板
   * @function
   * @param {string} source 模板
   * @param {Object} options 配置
   * @returns {Function}
   * @description
   * 当渲染器已经被缓存的情况下，options 除 override 外的所有属性均不会
   * 对渲染器造成任何修改；当 override 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  public compileSource (source: string, options: Object): Function {
    return Engine.prototype.compile.apply(this, arguments)
  }

  /**
   * 渲染模板
   * @function
   * @param {string} source 模板
   * @param {Object} options 配置
   * @returns {Function}
   * @description
   * 当渲染器已经被缓存的情况下，options 除 override 外的所有属性均不会
   * 对渲染器造成任何修改；当 override 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  public renderSource (source: string, options: Object): Function {
    return Engine.prototype.render.apply(this, arguments)
  }

  /**
   * 编译模板
   * @param {string} template 模板
   * @param {Function} callback 回调函数 (optional) - 只有在异步编译才需要/only in async
   * @param {Object} options 配置
   * @return {Function}
   */
  public compile (template: string, callback: Function, options: Object = {}) {
    let conf: Object  = extend({}, this.DEFAULTS, options, { filename: template })
    let sync: Boolean = !!conf.sync

    if (is('Object')(callback)) {
      return this.compile(template, null, callback)
    }

    if (false === sync && !is('Function')(callback)) {
      return new Function
    }

    template = toString(template)

    let render  : any = true === conf.override ? undefined : this._cache(template)
    if (is('Function')(render)) {
      return sync ? render : (callback(render), undefined)
    }

    let node: HTMLElement = document.getElementById(template)

    if (node) {
      let source: string = node.innerHTML.replace(/^ *\n|\n *$/g, '')
      render = this.compileSource(source, conf)
      return sync ? render : (callback(render), undefined)
    }

    this.getSourceByAjax(template, (source: string) => {
      let origin        : string        = source
      let dependencies  : Array<string> = []

      // source 经过这里会变得不纯正
      // 主要用于确定需要导入的模板
      if (false === conf.noSyntax) {
        source = this.$compileSyntax(source, conf.strict)
      }

      // 必须使用最原始的语法来做判断 `<%# include template [, data] %>`
      forEach(source.split('<%'), (code: string) => {
        let codes: Array<string> = code.split('%>')
        let match: any

        // logic block is fist part when `codes.length === 2`
        // 逻辑模块
        if ((1 !== codes.length)
         && (match = /include\s*\(\s*([\w\W]+?)(\s*,\s*([^\)]+)?)?\)/.exec(codes[0]))) {
          dependencies.push(match[1].replace(/[\'\"\`]/g, ''))
        }
      })

      let total: number = dependencies.length

      function __exec () {
        0 >= (-- total) && __return()
      }

      function __return () {
        render = this.$compile(origin)
        this._cache(template, render)
        false === sync && callback(render)
        total = undefined
      }

      if (total > 0) {
        forEach(unique(dependencies), (child: string) => {
          if (this._cache(child)) {
            __exec.call(this)
          }
          else {
            let childSource: string = findChildTemplate(child, origin)

            if (childSource) {
              this.compileSource(childSource, {
                filename: child,
                override: !!conf.override
              })

              __exec.call(this)
            }
            else {
              this.compile(child, __exec, conf)
            }
          }
        })
      }
      else {
        __return.call(this)
      }
    },
    {
      sync: sync
    })

    return render

    function findChildTemplate (templateId: string, source: string): string {
      let node: HTMLElement = document.createElement('div')
      node.innerHTML = source

      let templateNodes: NodeList = node.getElementsByTagName('script')
      for (let i: number = templateNodes.length; i --;) {
        if (templateId === templateNodes[i].id) {
          return templateNodes[i].innerHTML
        }
      }
      
      return ''
    }
  }
}