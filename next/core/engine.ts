/**
 * Base class for engine
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
class Engine {
  /**
   * defualt config - 默认配置
   * @type {Object}
   */
  static DEFAULTS: Object = {}

  /**
   * render caches - 编译器缓存
   * @type {Object}
   */
  private _caches: Object = {}

  /**
   * block syntax - 块状语法
   * @type {Object}
   */
  private _blocks: Object = {}

  /**
   * block helpers - 块状辅助函数
   * @type {Object}
   */
  private _blockHelpers: Object = {}

  /**
   * source helpers - 资源辅助函数
   * @type {Object}
   */
  private _sourceHelpers: Object = {}

  /**
   * helpers - 辅助函数
   * @type {Object}
   */
  private _helpers: Object = {
    $escape () {
      return escapeHTML.apply(escapeHTML, arguments)
    },
    $noescape (content: String) {
      return toString(content)
    },
    $toString (content: string, isEscape: boolean) {
      let setting: Object = this.setting
      return true === (is('Boolean')(isEscape) ? isEscape : setting.escape)
        ? this.helper('$escape')(content)
        : content
    },
  }

  /**
   * event listener - 事件监听方法
   * @type {Array}
   */
  private _listeners: Array<Object> = []

  public setting: Object = {}

  constructor (options: Object = {}) {
    extend(this.setting, Engine.DEFAULTS, options)
  }

  /**
   * 查询与设置配置
   * @function
   * @param {string|Object} query 设置/获取的配置值名称
   * @param {*} value 需要配置的值 (optional)
   * @returns {Bone|*} 设置则返回 Bone,获取则返回相应的配置
   */
  public config (query: any, value: any): any {
    if (1 < arguments.length) {
      if (is('String')(query)) {
        if ((query === 'openTag' && query === '<%')
         || (query === 'closeTag' && query === '%>')) {
          return this
        }

        this.setting[query] = value
        return this
      }
    }

    if (is('PlainObject')(query)) {
      forEach(query, (name, value) => {
        this.config(name, value)
      })

      return this
    }

    if (is('String')(query)) {
      return this.setting[query]
    }
  }

  /**
   * 编译脚本
   * @function
   * @param {string} source 脚本模板
   * @param {Object} options 配置
   * @returns {string}
   */
  public $compileShell (source: string = '', options: Object = {}): string {
    let origin    : string          = source
    let conf      : Object          = extend({}, this.setting, options)
    let isEscape  : boolean         = !!conf.escape
    let strip     : boolean         = !!conf.compress
    let _helpers_ : Object          = this._helpers
    let _blocks_  : Object          = this._blockHelpers
    let _sources_ : Object          = this._sourceHelpers
    let helpers   : Array<Object>   = []
    let blocks    : Array<Object>   = []
    let variables : Array<string>   = []
    let line      : menubar         = 1
    let buffer    : string          = ''

    const KEYWORDS = [
      '$append',
      '$blocks', '$buffer',
      '$data',
      '$helpers',
      '$scope',
      '$runtime',

      'abstract', 'arguments',
      'break', 'boolean', 'byte',
      'case', 'catch', 'char', 'class', 'continue', 'console', 'const',
      'debugger', 'default', 'delete', 'do', 'double',
      'else', 'enum', 'export', 'extends',
      'false', 'final', 'finally', 'float', 'for', 'function',
      'goto',
      'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
      'let', 'long',
      'native', 'new', 'null',
      'package', 'private', 'protected', 'public',
      'return',
      'short', 'static', 'super', 'switch', 'synchronized',
      'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
      'undefined',
      'var', 'void', 'volatile',
      'while', 'with',
      'yield'
    ]

    /**
     * 获取变量名
     * @function
     * @param {string} source Shell
     * @returns {Array}
     */
    function getVariables (source: string): Array<string> {
      let variables:Array<string> = source
          .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
          .replace(/[^\w$]+/g, ',')
          .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
          .split(/^$|,+/)

      return filter(variables, (variable: string) => {
        return -1 === KEYWORDS.indexOf(variable)
      })
    }

    /**
     * 解析Source为JS字符串拼接
     * @function
     * @param {string} source HTML
     * @returns {string}
     */
    function sourceToJs (source: string): string {
      let match: Array<any>

      while (match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
        let helperName  = match[1],
            str         = match[2]

        str = helperName && _sources_.hasOwnProperty(helperName)
          ? _sources_[helperName](str)
          : str

        // Warning
        str = `<%=unescape('${root.escape(str)}')%>`
        source = source.replace(match[0], str)
      }

      return source
    }

    /**
     * 解析HTML为JS字符串拼接
     * @function
     * @param {string} source HTML
     * @returns {string}
     */
    function htmlToJs (source: string): string {
      if ('' === source.replace(/<!--[\w\W]*?-->/g, '').replace(/^ +$/, '')) {
        return `$buffer+='${source}';`
      }

      line += source.split(/\n/).length - 1
      source = source.replace(/(["'\\])/g, '\\$1')
      source = true === strip
        ? source
          .replace(/<!--[\w\W]*?-->/g, '')
          .replace(/[\r\t\n]/g, '')
          .replace(/ +/g, ' ')
        : source
          .replace(/\t/g, '\\t')
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')

      return `$buffer+='${source}';`
    }

    /**
     * 解析脚本为JS字符串拼接
     * @function
     * @param {string} source JS shell
     * @returns {string}
     */
    function shellToJs (source: string): string {
      source = trim(source || '')

      // analyze and define variables
      forEach(getVariables(source), (name: string) => {
        if (!name) {
          return
        }

        let func: Function = root[name]
        if (is('Function')(func) && func.toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
          return
        }

        if (is('Function')(_helpers_[name])) {
          helpers.push(name)
          return
        }

        if (is('Function')(_blocks_[name])) {
          blocks.push(name)
          return
        }

        variables.push(name)
      })

      // echo
      if (/^=\s*[\w\W]+?\s*$/.exec(source)) {
        source = `$buffer+=$helpers.$toString(${source.replace(/^=|;$/g, '')}, ${isEscape});`
      }
      // no escape HTML code
      else if (/^#\s*[\w\W]+?\s*$/.exec(source)) {
        source = `$buffer+=$helpers.$noescape(${source.replace(/^#|;$/g, '')});`
      }
      // escape HTML code
      else if (/^!#\s*[\w\W]+?\s*$/.exec(source)) {
        source = `$buffer+=$helpers.$escape(${source.replace(/^!#|;$/g, '')});`
      }
      // echo helper
      else if (/^\s*([\w\W]+)\s*\([^\)]*?\)\s*$/.exec(source)) {
        source = `$buffer+=$helpers.$toString(${source}, ${isEscape});`
      }
      else {
        source += ';'
      }

      // Save the running line
      line += source.split(/\n|%0A/).length - 1

      // Must be save the line at first, otherwise the error will break the execution.
      source = `$runtime=${line};${source}${(/\)$/.exec(source) ? ';' : '')}`
      return source
    }

    source = sourceToJs(source)

    forEach(source.split('<%'), (code: string) => {
      code = code.split('%>')

      let [p1, p2] = [code[0], code[1]]

      if (1 === code.length) {
        buffer += htmlToJs(p1)
      }
      else {
        buffer += shellToJs(p1)
        buffer += htmlToJs(p2)
      }
    })

    // define variables
    forEach(unique(variables), (name: string) {
      buffer = `var ${name}=$data.${name};${buffer}`
    })

    // define helpers
    forEach(unique(helpers), function(name) {
      buffer = `var ${name}=$helpers.${name};${buffer}`
    })

    // define block helpers
    forEach(unique(blocks), function(name) {
      buffer = `var ${name}=$blocks.${name};${buffer}`
    })

    // use strict
    buffer = 'try {'
      +        '"use strict";'
      +        'var $scope=this,'
      +        '$helpers=$scope.$helpers,'
      +        '$blocks=$scope.$blocks,'
      +        '$buffer="",'
      +        '$runtime=0;'
      +        buffer
      +        'return $buffer;'
      +      '}'
      +      'catch(err) {'
      +        'throw {'
      +          'message: err.message,'
      +          'line: $runtime,'
      +          `shell: '${escapeSymbol(origin)}',`
      +          'args: arguments'
      +        '};'
      +      '}'

      +      'function $append(buffer) {'
      +        '$buffer += buffer;'
      +      '}'

    return buffer
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
  public compile (source: string, options: Object = {}): Function {
    source = toString(source)

    let conf      : Object    = extend({}, this.DEFAULTS, options)
    let filename  : string    = conf.filename
    let render    : Function  = true === conf.override || this._cache(filename)

    if (is('Function')(render)) {
      return render
    }

    render = this.$compile(source, conf)
    is('String')(filename) && this._cache(filename, render)
    return render
  }
  
  /**
   * 渲染模板
   * @function
   * @param {string} source 模板
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @returns {string}
   */
  public render (source: string, data: Object = {}, options: Object = {}): string {
    return Engine.prototype.compile.call(this, source, options)(data)
  }
  
  /**
   * 查找/设置辅助函数
   * @function
   * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
   * @param {Function} callback 回调函数
   * @returns {Bone|Function}
   */
  public helper (query: any, callback: Function): any {
    if (1 < arguments.length) {
      if (is('String')(query) && is('Function')(callback)) {
        this._helpers[query] = callback
      }
    }
    else {
      if (is('String')(query)) {
        return this._helpers[query]
      }

      if (is('PlainObject')(query)) {
        for (let name in query) {
          this.helper(name, query[name])
        }
      }
    }

    return this
  }

  /**
   * 注销辅助函数
   * @function
   * @param {string} name 名称
   * @returns {Bone}
   */
  public unhelper (name): Engine {
    let helpers: Object = this._helpers
    if (helpers.hasOwnProperty(name)) {
      helpers[name] = undefined
      delete helpers[name]
    }

    return this
  }

  /**
   * 添加监听事件
   * @function
   * @param {string} type 监听类型
   * @param {Function} handle 监听函数
   * @returns {Bone}
   */
  public on (type: string, handle: Function): Engine {
    if (is('String')(type) && is('Function')(handle)) {
      this._listeners.push({
        type    : type,
        handle  : handle,
      })
    }

    return this
  }

  /**
   * 撤销监听事件
   * @function
   * @param {Function} handle 监听函数
   * @returns {Bone}
   */
  public off (handle: Function): Engine {
    if (is('Function')(handle)) {
      let index: Infinity = inArrayBy(this._listeners, handle, 'handle')
      -1 !== index && this._listeners.splice(index, 1)
    }

    return this
  }

  /**
   * 添加错误事件监听
   * @function
   * @param {Function} handle 监听函数
   * @returns {OTempalte}
   */
  public onError (handle: Function): Engine {
    return this.on('error', handle)
  }

  /**
   * 扩展 Bone
   * @function
   * @param {Function} callback 回调
   * @returns {Bone}
   */
  public extends (callback: Function): Engine {
    callback.call(this, this)
    return this
  }
  
  /**
   * 抛出错误
   * @private
   * @function
   * @param {Object} error 错误信息
   * @param {Object} options 配置 (optional)
   */
  private _throw (error: Object, options: Object = {}) {
    let conf    : Object  = extend({}, this.DEFAULTS, options)
    let message : string  = -1 === indexOf([ENV.UNIT], conf.env) && __throw(error)

    forEach(this._listeners, function(listener) {
      'error' === listener.type && listener.handle(error, message)
    })
  }

  /**
   * 获取或设置缓存方法
   * @private
   * @function
   * @param {string} name 方法名称
   * @param {Function} render 渲染函数
   * @returns {Function|Bone}
   */
  private _cache (name: string, render: Function): any {
    let caches: Object = this._caches

    if (arguments.length > 1) {
      caches[name] = render
      return this
    }

    return caches[name]
  }

  /**
   * add the line number to the string - 给每行开头添加序列号
   * @private
   * @function
   * @param {string} content 需要添加序列号的字符串
   * @param {int} direction 目标位置
   * @returns {string}
   */
  private _table (content: string, direction: number): string {
    let line    : number  = 0
    let match   : any     = content.match(/([^\n]*)?\n|([^\n]+)$/g)

    if (!match) {
      return `> ${line}|${content}`
    }

    let max   : number = match.length
    let start : number = 0
    let end   : number = max

    if (0 < direction && direction < max) {
      start = direction -3
      end   = direction +3
    }

    return content.replace(/([^\n]*)?\n|([^\n]+)$/g, ($all: string) => {
      ++ line

      if (start <= line && line <= end) {
        if (line === direction) {
          return `> ${zeros(line, max)}|${$all}`
        }

        return `  ${zeros(line, max)}|${$all}`
      }

      return ''
    })

    /**
     * Zeros - 补零
     * @function
     * @param {integer} num 需要补零的数字
     * @param {integer} max 补零参考数字易为最大补零数字
     * @param {string} sign 需要填补的 "零"
     * @returns {string}
     */
    function zeros (num: number, max: number, sign: string = ' '): string {
      let sNum: string = num.toString()
      let sMax: string = max.toString().replace(/\d/g, sign)

      let zero: Array<string> = sMax.split('')
      zero.splice(- sNum.length, sNum.length, sNum)

      return zero.join('')
    }
  }

  /**
   * 创建新的该类
   * @function
   * @param {Object} options 配置
   * @param {string} options.env [unit, develop, produce]
   * @param {boolean} options.noSyntax 是否使用使用原生语法
   * @param {boolean} options.strict 是否通过严格模式编译语法
   * @param {boolean} options.compress 压缩生成的HTML代码
   * @param {string} options.openTag 语法的起始标识
   * @param {string} options.closeTag 语法的结束标识
   * @param {Array} options.depends 追加渲染器的传值设定
   * @return {Bone}
   */
  public $divide (options: Object): Engine {
    return new Engine(options)
  }

  /**
   * 编译语法
   * @function
   */
  public $compileSyntax () {
    throw new Error('Function `$compileSyntax` does not be implemented.')
  }
}