/**
 * extensions - 扩展集合
 * @type {Array}
 */
let extensions = []

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
   * render caches - 编译器缓存
   * @type {Object}
   */
  _caches = {}

  /**
   * block syntax - 块状语法
   * @type {Object}
   */
  _blocks = {}

  /**
   * block helpers - 块状辅助函数
   * @type {Object}
   */
  _blockHelpers = {}

  /**
   * source helpers - 资源辅助函数
   * @type {Object}
   */
  _sourceHelpers = {}

  /**
   * helpers - 辅助函数
   * @type {Object}
   */
  _helpers = {
    $escape () {
      return escapeHTML.apply(escapeHTML, arguments)
    },

    $noescape (string) {
      return toString(string)
    },

    $toString (string, isEscape) {
      string = toString(string)

      return isEscape
      ? this.$escape(string)
      : string
    },
  }

  /**
   * event listener - 事件监听方法
   * @type {Array}
   */
  _listeners = []

  /**
   * defualt config - 默认配置
   * @type {Object}
   */
  setting = extend({}, DEFAULTS)

  /**
   * 构造函数
   * @function
   * @param {Object} options 配置 (optional)
   */
  constructor (options = {}) {
    // set the config - 设置配置
    this.setting = extend(this.setting, options)

    // set any extensions - 设置扩展
    if (is('Array')(extensions) && 0 < extensions.length) {
      forEach(extensions, (extension) => {
        this.extends(extension)
      })
    }
  }

  /**
   * 获取当前配置
   * @param  {Object} options 配置
   * @return {Object} 整合后的配置
   */
  options (...args) {
    return extend.apply({}, [{}, this.setting].concat(args))
  }

  /**
   * 查询与设置配置
   * @function
   * @param {string|Object} query 设置/获取的配置值名称
   * @param {*} value 需要配置的值 (optional)
   * @returns {Engine|*} 设置则返回 Engine,获取则返回相应的配置
   */
  config (query, value) {
    if (1 < arguments.length) {
      if (is('String')(query)) {
        if ('openTag' === query && '<%' === query
        || 'closeTag' === query && '%>' === query) {
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
   * @param {string} source 脚本模板
   * @param {Object} options 配置
   * @return {string} 逻辑模板
   */
  $compileShell (source = '', options = {}) {
    let origin    = source
    let conf      = this.options(options)
    let isEscape  = !!conf.escape
    let strip     = !!conf.compress
    let _helpers_ = this._helpers
    let _blocks_  = this._blockHelpers
    let _sources_ = this._sourceHelpers
    let helpers   = []
    let blocks    = []
    let variables = []
    let line      = 1
    let buffer    = ''

    /**
     * 获取变量名
     * @param {string} source Shell
     * @return {Array} 变量名称集合
     */
    let getVariables = (source) => {
      let variables = source
      .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
      .replace(/[^\w$]+/g, ',')
      .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
      .split(/^$|,+/)

      return filter(variables, (variable) => {
        return -1 === KEYWORDS.indexOf(variable)
      })
    }

    /**
     * 解析Source为JS字符串拼接
     * @param {string} source HTML
     * @return {string} 非编译数据字符串
     */
    let sourceToJs = (source) => {
      let match

      while (match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
        let helperName = match[1]
        let str = match[2]

        if (helperName && _sources_.hasOwnProperty(helperName)) {
          str = _sources_[helperName](str)
        }

        str = `<%=unescape('${root.escape(str)}')%>`
        source = source.replace(match[0], str)
      }

      return source
    }

    /**
     * 解析HTML为JS字符串拼接
     * @param {string} source HTML
     * @return {string} HTML字符串
     */
    let htmlToJs = (source) => {
      if ('' === source.replace(/<!--[\w\W]*?-->/g, '').replace(/^ +$/, '')) {
        return `$buffer+='${source}';`
      }

      // Storage running line
      line += source.split(/\n/).length - 1

      // encode
      source = source.replace(/(["'\\])/g, '\\$1')

      // check compress or not
      if (true === strip) {
        source = source
        .replace(/<!--[\w\W]*?-->/g, '')
        .replace(/[\r\t\n]/g, '')
        .replace(/ +/g, ' ')
      }
      else {
        source = source
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
      }

      // concat every block
      return `$buffer+='${source}';`
    }

    /**
     * 解析脚本为JS字符串拼接
     * @param {string} source JS shell
     * @return {string} 逻辑字符串
     */
    let shellToJs = (source) => {
      source = trim(source || '')

      // analyze and define variables
      forEach(getVariables(source), (name) => {
        if (!name) {
          return
        }

        let func = root[name]
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
        source = `$buffer+=$helpers.$toString(${source.replace(/^=|;$/g, '')}, !!${isEscape});`
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
        source = `$buffer+=$helpers.$toString(${source}, !!${isEscape});`
      }
      // nothing to match
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

    // split logic and html
    forEach(source.split('<%'), (code) => {
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
    forEach(unique(variables), (name) => {
      buffer = `var ${name}=$data.${name};${buffer}`
    })

    // define helpers
    forEach(unique(helpers), (name) => {
      buffer = `var ${name}=$helpers.${name};${buffer}`
    })

    // define block helpers
    forEach(unique(blocks), (name) => {
      buffer = `var ${name}=$blocks.${name};${buffer}`
    })

    // use strict
    /* eslint no-multi-spaces: 0 */
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
   * 编译模板为函数
   * @param {string} source 资源
   * @param {Object} options 编译配置 (optional)
   * @return {Function} 模板方法
   * @description
   *
   * Render and it's options will be cached together,
   * and they can not be modified by any operation.
   * If you want to replace or modify the options, u
   * must compile it again. And u can use options.override
   * to override it.
   *
   * 渲染器的 options 将与渲染器一起缓存起来，且不会被
   * 外界影响，若要修改 options，则必须重新生成渲染器，
   * 可以设置 options.override 为 true 来覆盖
   */
  $compile (source = '', options = {}) {
    let origin  = source
    let conf    = this.options(options)
    let strip   = !!conf.compress
    let deps    = conf.depends
    let _args_  = ['$data'].concat(deps)
    let args    = []

    let buildRender = (scope) => {
      let render

      let __catch = (err) => {
        let _err = {
          message   : `[Exec Render]: ${err.message}`,
          template  : options.filename,
          line      : err.line,
          source    : this._table(scope.$source, err.line),
          shell     : this._table(err.shell, err.line),
        }

        forEach(_args_, (name, key) => {
          _err[`arguments:${name}`] = err.args[key]
        })

        this._throw(_err)
        return ''
      }

      try {
        render = new Function(_args_.join(','), shell)
      }
      catch (err) {
        this._throw({
          message   : `[Compile Render]: ${err.message}`,
          template  : options.filename,
          line      : `Javascript syntax occur error, it can not find out the error line.`,
          syntax    : this._table(origin),
          source    : source,
          shell     : shell
        })

        render = __render
      }

      if (false === strip) {
        return (data) => {
          try {
            let source = render.apply(scope, [data].concat(args))
            return source.replace(/<!--([\w\W]+?)-->/g, ($all, $1) => {
              return `<!--${root.unescape($1)}-->`
            })
          }
          catch (err) {
            return __catch(err)
          }
        }
      }
      else {
        return (data) => {
          try {
            return render.apply(scope, [data].concat(args))
          }
          catch (err) {
            return __catch(err)
          }
        }
      }
    }

    // 获取需求的参数，除 data 之外
    ~forEach(deps, (name) => {
      if ('$' === name.charAt(0)) {
        name = name.replace('$', '')
        args.push(conf[name])
      }
      else {
        args.push(undefined)
      }
    })

    if (false === strip) {
      source = source.replace(/<!--([\w\W]+?)-->/g, ($all, $1) => {
        return `<!--${root.escape($1)}-->`;
      })
    }

    if (true !== conf.noSyntax) {
      source = this.$compileSyntax(source, !!conf.strict)
    }

    let shell = this.$compileShell(source, conf)

    return buildRender({
      $source   : origin,
      $helpers  : this._helpers || {},
      $blocks   : this._blockHelpers || {}
    })
  }

  /**
   * 编译模板
   * @function
   * @param {string} source 模板
   * @param {Object} options 配置
   * @return {Function} 模板方法
   * @description
   * 当渲染器已经被缓存的情况下，options 除 override 外的所有属性均不会
   * 对渲染器造成任何修改；当 override 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  compile (source, options = {}) {
    source = toString(source)

    let conf     = this.options(options)
    let filename = conf.filename
    let render   = true === conf.override || this._cache(filename)

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
   * @return {string} 模板字符串
   */
  render (source, data = {}, options = {}) {
    return Engine.prototype.compile.call(this, source, options)(data)
  }

  /**
   * 查找/设置辅助函数
   * @function
   * @param {string|Object} query 需要查找或设置的函数名|需要设置辅助函数集合
   * @param {Function} callback 回调函数
   * @returns {Engine|Function} 模板引擎或辅助方法
   */
  helper (query, callback) {
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
   * @return {Engine} 模板引擎对象
   */
  unhelper (name) {
    let helpers = this._helpers
    if (helpers.hasOwnProperty(name)) {
      delete helpers[name]
    }

    return this
  }

  /**
   * 添加监听事件
   * @function
   * @param {string} type 监听类型
   * @param {Function} handle 监听函数
   * @return {Engine} 模板引擎对象
   */
  on (type, handle) {
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
   * @return {Engine} 模板引擎本身
   */
  off (handle) {
    if (is('Function')(handle)) {
      let index = inArrayBy(this._listeners, handle, 'handle')
      ;-1 !== index && this._listeners.splice(index, 1)
    }

    return this
  }

  /**
   * 添加错误事件监听
   * @function
   * @param {Function} handle 监听函数
   * @return {Engine} 模板引擎本身
   */
  onError (handle) {
    return this.on('error', handle)
  }

  /**
   * 扩展 Engine
   * @function
   * @param {Function} callback 回调
   * @return {Engine} 模板引擎本身
   */
  extends (callback) {
    callback.call(this, this)
    return this
  }

  /**
   * 抛出错误
   * @param {Object} error 错误信息
   * @param {Object} options 配置 (optional)
   */
  _throw (error, options = {}) {
    let conf    = this.options(options)

    if (-1 === indexOf([ENV.UNITEST, ENV.PRODUCT], conf.env)) {
      let message = __throw(error)

      forEach(this._listeners, (listener) => {
        'error' === listener.type && listener.handle(error, message)
      })
    }
  }

  /**
   * 获取或设置缓存方法
   * @private
   * @function
   * @param {string} name 方法名称
   * @param {Function} render 渲染函数
   * @return {Function|Engine} 返回缓存的模板方法|当前对象
   */
  _cache (name, render) {
    let caches = this._caches
    if (1 < arguments.length) {
      caches[name] = render
      return this
    }

    return caches[name]
  }

  /**
   * add the line number to the string - 给每行开头添加序列号
   * @private
   * @function
   * @param {string} string 需要添加序列号的字符串
   * @param {number} scope 显示范围
   * @return {string} 错误信息
   */
  _table (string, scope) {
    let line  = 0
    let match = string.match(/([^\n]*)?\n|([^\n]+)$/g)

    if (!match) {
      return `> ${line}|${string}`
    }

    let max = match.length
    let [start, end] = [0, max]

    if (0 < scope && scope < max) {
      start = scope - 3
      end   = scope + 3
    }

    /**
     * Zeros - 补零
     * @param {integer} num 需要补零的数字
     * @param {integer} max 补零参考数字易为最大补零数字
     * @param {string} zero 需要填补的 "零"
     * @return {string} 补零后的字符串
     */
    let zeros = function (num, max, zero = ' ') {
      num = num.toString()
      max = max.toString().replace(/\d/g, zero)

      let res = max.split('')
      res.splice(0 - num.length, num.length, num)
      return res.join('')
    }

    return string.replace(/([^\n]*)?\n|([^\n]+)$/g, ($all) => {
      ++ line

      if (start <= line && line <= end) {
        if (line === scope) {
          return `> ${zeros(line, max)}|${$all}`
        }

        return `  ${zeros(line, max)}|${$all}`
      }

      return ''
    })
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
   * @return {Engine} 新的模板引擎对象
   */
  $divide (options) {
    return new this.constructor(options)
  }

  /**
   * current envirment - 配置环境
   * @type {Object}
   */
  get ENV () {
    return ENV
  }

  /**
   * 扩展库
   * @function
   * @param  {Function} extension 扩展方法
   * @return {Engine} 模板引擎本身
   */
  static extend (extension) {
    is('Function')(extension) && extensions.push(extension)
    return this
  }

  $compileSyntax () {
    throw new Error('Function `$compileSyntax` does not be implemented.')
  }
}