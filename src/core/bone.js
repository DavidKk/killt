/**
 * extensions - 扩展集合
 * @type {Array}
 */
let extensions = []


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
class Bone {
  /**
   * 构造函数
   * @function
   * @param {Object} options 配置 (optional)
   */
  constructor (options = {}) {
    let self = this

    /**
     * render caches - 编译器缓存
     * @type {Object}
     */
    this._caches = {}

    /**
     * block syntax - 块状语法
     * @type {Object}
     */
    this._blocks = {}

    /**
     * block helpers - 块状辅助函数
     * @type {Object}
     */
    this._blockHelpers = {}

    /**
     * source helpers - 资源辅助函数
     * @type {Object}
     */
    this._sourceHelpers = {}

    /**
     * helpers - 辅助函数
     * @type {Object}
     */
    this._helpers = {}

    /**
     * defualt config - 默认配置
     * @type {Object}
     */
    this.DEFAULTS = {}

    /**
     * event listener - 事件监听方法
     * @type {Array}
     */
    this._listeners = []

    // set the config - 设置配置
    ~extend(this.DEFAULTS, DEFAULTS, options)

    // set any helpers - 设置基础辅助函数
    ~extend(this._helpers, {
      $escape: function() {
        return escapeHTML.apply(escapeHTML, arguments)
      },
      $noescape: function(string) {
        return toString(string)
      },
      $toString: function(string, isEscape) {
        string = toString(string)

        let conf = self.DEFAULTS
        return true === (is('Boolean')(isEscape) ? isEscape : conf.escape)
          ? self.helper('$escape')(string)
          : string
      },
      include: function(filename, data = {}, options = {}) {
        let conf = self.DEFAULTS,
            node = document.getElementById(filename)

        if (node) {
          self._throw({
            message: `[Include Error]: Template ID ${filename} is not found.`
          })

          return ''
        }

        return self.render(node.innerHTML, data, options)
      }
    })

    // set any extensions - 设置扩展
    if (is('Array')(extensions) && extensions.length > 0) {
      forEach(extensions, function(extension) {
        self.extends(extension)
      })
    }
  }

  /**
   * 查询与设置配置
   * @function
   * @param {string|Object} query 设置/获取的配置值名称
   * @param {*} value 需要配置的值 (optional)
   * @returns {Bone|*} 设置则返回 Bone,获取则返回相应的配置
   */
  config (query, value) {
    if (1 < arguments.length) {
      if (is('String')(query)) {
        if ((query === 'openTag' && query === '<%') || (query === 'closeTag' && query === '%>')) {
          return this
        }

        this.DEFAULTS[query] = value
        return this
      }
    }

    let self = this
    if (is('PlainObject')(query)) {
      forEach(query, function(name, value) {
        self.config(name, value)
      })

      return this
    }

    if (is('String')(query)) {
      return this.DEFAULTS[query]
    }
  }

  /**
   * 编译脚本
   * @function
   * @param {string} source 脚本模板
   * @param {Object} options 配置
   * @returns {string}
   */
  $compileShell (source = '', options = {}) {
    let origin    = source,
        conf      = extend({}, this.DEFAULTS, options),
        isEscape  = !!conf.escape,
        strip     = !!conf.compress,
        _helpers_ = this._helpers,
        _blocks_  = this._blockHelpers,
        _sources_ = this._sourceHelpers,
        helpers   = [],
        blocks    = [],
        variables = [],
        line      = 1,
        buffer    = ''

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
    let getVariables = function (source) {
      let variables = source
            .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
            .replace(/[^\w$]+/g, ',')
            .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
            .split(/^$|,+/)

      return filter(variables, function(variable) {
        return -1 === KEYWORDS.indexOf(variable)
      })
    }

    /**
     * 解析Source为JS字符串拼接
     * @function
     * @param {string} source HTML
     * @returns {string}
     */
    let sourceToJs = function (source) {
      let match
      while (match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
        let helperName = match[1]
        let str = match[2]

        str = helperName && _sources_.hasOwnProperty(helperName)
          ? _sources_[helperName](str)
          : str

        str = `<%=unescape('${window.escape(str)}')%>`
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
    let htmlToJs = function (source) {
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
    let shellToJs = function (source) {
      source = trim(source || '')

      // analyze and define variables
      forEach(getVariables(source), function(name) {
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

    forEach(source.split('<%'), function(code) {
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
    forEach(unique(variables), function(name) {
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
      +          `shell: '${escapeSymbol(origin)}'`
      +        '};'
      +      '}'

      +      'function $append(buffer) {'
      +        '$buffer += buffer;'
      +      '}'

    return buffer
  }

  /**
   * 编译模板为函数
   * @function
   * @param {string} source 资源
   * @param {Object} options 编译配置 (optional)
   * @returns {Function}
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
    source = trim(source)

    let self    = this,
        origin  = source,
        conf    = extend({}, this.DEFAULTS, options),
        strip   = !!conf.compress,
        deps    = conf.depends,
        _args_  = ['$data'].concat(deps).join(','),
        args    = []

    // 获取需求的参数，除 data 之外
    ~forEach(deps, function(name) {
      if ('$' === name.charAt(0)) {
        name = name.replace('$', '')
        args.push(conf[name])
      }
      else {
        args.push(undefined)
      }
    })

    if (false === strip) {
      source = source.replace(/<!--([\w\W]+?)-->/g, function($all, $1) {
        return `<!--${window.escape($1)}-->`;
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

    function buildRender (scope) {
      let render

      try {
        render = new Function(_args_, shell)
      }
      catch (err) {
        self._throw({
          message   : `[Compile Render]: ${err.message}`,
          line      : `Javascript syntax occur error, it can not find out the error line.`,
          syntax    : self._table(origin),
          template  : source,
          shell     : shell
        })

        render = __render
      }

      if (false === strip) {
        return function(data) {
          try {
            let source = render.apply(scope, [data].concat(args))
            return source.replace(/<!--([\w\W]+?)-->/g, function($all, $1) {
              return `<!--${window.unescape($1)}-->`
            })
          }
          catch (err) {
            return __catch(err)
          }
        }
      }
      else {
        return function(data) {
          try {
            return render.apply(scope, [data].concat(args))
          }
          catch (err) {
            return __catch(err)
          }
        }
      }

      function __catch (err) {
        err = extend({}, err, {
          source: self._table(scope.$source, err.line)
        })

        self._throw({
          message   : `[Exec Render]: ${err.message}`,
          line      : err.line,
          template  : err.source,
          shell     : self._table(err.shell, err.line)
        })

        return ''
      }
    }
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
  compile (source, options = {}) {
    source = toString(source)

    let conf     = extend({}, this.DEFAULTS, options),
        filename = conf.filename,
        render   = true === conf.override || this._cache(filename)

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
  render (source, data = {}, options = {}) {
    return this.compile(source, options)(data)
  }

  /**
   * 查找/设置辅助函数
   * @function
   * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
   * @param {Function} callback 回调函数
   * @returns {Bone|Function}
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
   * @returns {Bone}
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
   * @returns {Bone}
   */
  on (type, handle) {
    if (is('String')(type) && is('Function')(handle)) {
      this._listeners.push({
        type: type,
        handle: handle
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
  off (handle) {
    if (is('Function')(handle)) {
      let index = inArrayBy(this._listeners, handle, 'handle')
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
  onError (handle) {
    return this.on('error', handle)
  }

  /**
   * 扩展 Bone
   * @function
   * @param {Function} callback 回调
   * @returns {Bone}
   */
  extends (callback) {
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
  _throw (error, options = {}) {
    let conf    = extend({}, this.DEFAULTS, options),
        message = __throw(error, conf.env === ENV.UNIT ? 'null' : 'log')

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
  _cache (name, render) {
    let caches = this._caches
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
   * @param  {string} str 需要添加序列号的字符串
   * @returns {string}
   */
  _table (string, direction) {
    let line  = 0,
        match = string.match(/([^\n]*)?\n|([^\n]+)$/g)

    if (!match) {
      return `> ${line}|${string}`
    }

    let max = match.length,
        [start, end] = [0, max]

    if (0 < direction && direction < max) {
      start = direction -3
      end   = direction +3
    }

    return string.replace(/([^\n]*)?\n|([^\n]+)$/g, function ($all) {
      ++ line

      if (start <= line && line <= end) {
        return `${line === direction ? '>' : ' '} ${zeros(line, max)}|${$all}`
      }

      return ''
    })

    /**
     * Zeros - 补零
     * @function
     * @param {integer} num 需要补零的数字
     * @param {integer} max 补零参考数字易为最大补零数字
     * @param {string} zero 需要填补的 "零"
     * @returns {string}
     */
    function zeros (num, max, zero = ' ') {
      num = num.toString()
      max = max.toString().replace(/\d/g, zero)

      let res = max.split('')
      res.splice(- num.length, num.length, num)
      return res.join('')
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
   * @param  {Function} _extends_ 扩展方法
   * @return {Bone}
   */
  static extend (extension) {
    is('Function')(extension) && extensions.push(extension)
    return this
  }

  /**
   * 编译语法
   * @function
   */
  $compileSyntax () {
    throw new Error('Function `$compileSyntax` does not be implemented.')
  }
}