~(function(root) {'use strict'
/**
 * A Template engine for Javascript
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
class OTemplate {
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
    ~extend(this.DEFAULTS, OTemplate.DEFAULTS, options)

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

    // set any syntax - 设置语法
    if (is('Array')(OTemplate._extends)) {
      forEach(OTemplate._extends, function(_extends_) {
        self.extends(_extends_)
      })
    }
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
        message = __throw(error, conf.env === OTemplate.ENV.UNIT ? 'null' : 'log')

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
   * @returns {Function|OTemplate}
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
   * 添加监听事件
   * @function
   * @param {string} type 监听类型
   * @param {Function} handle 监听函数
   * @returns {OTemplate}
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
   * @returns {OTemplate}
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
   * 生成一个新的 OTemplate 制作对象
   * @function
   * @param  {Object} options 配置
   * @returns {OTemplate} 新的 OTemplate
   */
  OTemplate (options) {
    return new OTemplate(options)
  }

  /**
   * 扩展 OTemplate
   * @function
   * @param {Function} callback 回调
   * @returns {OTemplate}
   */
  extends (callback) {
    callback.call(this, this)
    return this
  }

  /**
   * 查询与设置配置
   * @function
   * @param {string|Object} query 设置/获取的配置值名称
   * @param {*} value 需要配置的值 (optional)
   * @returns {OTemplate|*} 设置则返回 OTemplate,获取则返回相应的配置
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
   * 查找/设置辅助函数
   * @function
   * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
   * @param {Function} callback 回调函数
   * @returns {OTemplate|Function}
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
   * @returns {OTemplate}
   */
  unhelper (name) {
    let helpers = this._helpers
    if (helpers.hasOwnProperty(name)) {
      delete helpers[name]
    }

    return this
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
   * 扩展库
   * @function
   * @param  {Function} _extends_ 扩展方法
   * @return {OTemplate}
   */
  static extend (_extends_) {
    is('Function')(_extends_) && OTemplate._extends.push(_extends_)
    return this
  }
}

/**
 * current envirment - 配置环境
 * @type {Object}
 */
OTemplate.ENV = {
  /** production env - 生产环境 */
  PRODUCE : 1,
  /** develop env - 开发环境 */
  DEVELOP : 2,
  /** unit test env - 单元测试环境 */
  UNIT    : 3
}

/**
 * default options - 默认配置
 * @type {Object}
 */
OTemplate.DEFAULTS = {
  /** current entironment - 当前环境 [unit, develop, produce] */
  env       : OTemplate.ENV.PRODUCE,
  /** is use native syntax/是否使用使用原生语法 */
  noSyntax  : false,
  /** compile syntax in strict mode - 是否通过严格模式编译语法 */
  strict    : true,
  /** compress the html code - 压缩生成的HTML代码 */
  compress  : true,
  /** escape the HTML - 是否编码输出变量的 HTML 字符 */
  escape    : true,
  /** open tag for syntax - 起始标识 */
  openTag   : '{{',
  /** close tag for syntax - 结束标识 */
  closeTag  : '}}',
  /** addition render arguments (must be use `$` to define variable name) - 追加渲染器的传值设定,默认拥有 $data (必须使用 `$` 作为起始字符来定义变量) */
  depends   : [],
}

/**
 * extens plugins - 扩展集合
 * @type {Array}
 */
OTemplate._extends = []

~extend(OTemplate.prototype, {
  /**
   * current envirment - 配置环境
   * @type {Object}
   */
  ENV: OTemplate.ENV,

  /**
   * add the line number to the string - 给每行开头添加序列号
   * @private
   * @function
   * @param  {string} str 需要添加序列号的字符串
   * @returns {string}
   */
  _table: (function () {
    return function (string, direction) {
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
    }

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
  })(),

  /**
   * 编译脚本
   * @function
   * @param {string} source 脚本模板
   * @param {Object} options 配置
   * @returns {string}
   */
  $compileShell: (function () {
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
        return -1 === getVariables.KEYWORDS.indexOf(variable)
      })
    }

    getVariables.KEYWORDS = [
      '$scope', '$helpers', '$blocks', '$data', '$buffer', '$runtime', '$append',

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

    return function (source = '', options = {}) {
      let origin    = source,
          conf      = this.DEFAULTS,
          isEscape  = is('Boolean')(options.escape) ? options.escape : conf.escape,
          strip     = is('Boolean')(options.compress) ? options.compress : conf.compress,
          _helpers_ = this._helpers,
          _blocks_  = this._blockHelpers,
          _sources_ = this._sourceHelpers,
          helpers   = [],
          blocks    = [],
          variables = [],
          line      = 1,
          buffer    = ''

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
       * 删除所有字符串中的标签
       * @function
       * @param  {string} source HTML
       * @return {string}
       */
      let cleanTagsFromString = function (source) {
        let cleanTags = function ($all, $1, $2, $3) {
          return `${$1}${$2.replace(new RegExp(`<%|%>`, 'gim'), function ($all) {
            return $all.replace(new RegExp(`(${$all.split('').join('|')})`, 'gim'), '\\$1')
          })}${$3}`
        }

        return source
          .replace(new RegExp(`(\')([\\w\\W]+?)(\')`, 'gim'), cleanTags)
          .replace(new RegExp(`(\")([\\w\\W]+?)(\")`, 'gim'), cleanTags)
          .replace(new RegExp(`(\`)([\\w\\W]+?)(\`)`, 'gim'), cleanTags)
      }

      /**
       * 解析HTML为JS字符串拼接
       * @function
       * @param {string} source HTML
       * @returns {string}
       */
      let htmlToJs = function (source) {
        source = source
          .replace(/<!--[\w\W]*?-->/g, '')
          .replace(/^ +$/, '')

        if (source === '') {
          return ''
        }

        line += source.split(/\n/).length - 1
        source = source.replace(/(["'\\])/g, '\\$1')
        source = true === strip
          ? source
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
      // source = cleanTagsFromString(source)

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
  })(),

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
  $compile: (function () {
    return function(source = '', options = {}) {
      source = trim(source)

      let self    = this,
          origin  = source,
          conf    = extend({}, this.DEFAULTS, options),
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

        return function(data) {
          try {
            return render.apply(scope, [data].concat(args))
          }
          catch (err) {
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
    }
  })(),
})
;
let fs = require('fs')

/**
 * 读取文件
 * @function
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
function readFile (filename, callback) {
  if (is('Function')(callback)) {
    fs.readFile(filename, function(err, buffer) {
      callback(buffer.toString())
    })
  }
};
/**
 * 判断类型
 * @typedef {isType}
 * @function
 * @param {*} value 需要判断的值
 * @returns {boolean}
 */

/**
 * 判断对象是否为 type 类型
 * @function
 * @param {string} type
 * @return {isType}
 */
function is (type) {
  return function (value) {
    switch(type) {
      case 'Undefined':
        return 'undefined' === typeof value

      case 'Defined':
        return 'undefined' !== typeof value

      case 'Integer':
        let y = parseInt(value, 10)
        return !isNaN(y) && value === y && value.toString() === y.toString()

      case 'PlainObject':
        let ctor, prot
        if (false === is('Object')(value) || is('Undefined')(value)) {
            return false
        }

        ctor = value.constructor
        if ('function' !== typeof ctor) {
            return false
        }

        prot = ctor.prototype;
        if (false === is('Object')(prot)) {
            return false
        }

        if (false === prot.hasOwnProperty('isPrototypeOf')) {
            return false
        }

        return true

      default:
        return `[object ${type}]` === Object.prototype.toString.call(value)
    }
  }
}

/**
 * 获取所在行
 * @function
 * @param {string} string 需要查找的值
 * @param {number} position 编译
 * @returns {number}
 */
function inline (string, position) {
  return (string.substr(0, position).match(/\n/g) || []).length +1
}

/**
 * 去除空格
 * @function
 * @param {string} string
 * @return {string}
 */
function trim (string) {
  return toString(string).replace(/^\s+|\s+$/, '')
}

/**
 * 查找对象中的属性
 * @function
 * @param {Object} object 获取的对象
 * @param {string} path 查找路径
 * @param {string} spliter 分隔符 (默认为 `.`)
 * @returns {*} 若不存在返回 undefined，若存在则返回该指向的值
 * @example
 * {a:{a:{a:{a:1}}}} -> get('a.a.a.a') -> 1
 * {a:1}             -> get('a.a.a.a') -> undefined
 */
function get (object, path, spliter = '.') {
  if (!is('String')(path)) {
    return undefined
  }

  let [re, ns] = [object, path.split(spliter)]
  for (let [i, l] = [0, ns.length]; i < l; i ++) {
    if (is('Undefined')(re[ns[i]])) {
        return undefined
    }

    re = re[ns[i]]
  }

  return is('Undefined')(re) ? undefined : re
}

/**
 * 强制转化成字符串
 * @function
 * @param {*} anything 传入的值
 * @returns {string}
 */
function toString (anything) {
  if (is('String')(anything)) {
    return anything
  }

  if (is('Number')(anything)) {
    return anything += ''
  }

  if (is('Function')(anything)) {
    return toString(anything.call(anything))
  }

  return ''
}

/**
 * 转义标点符号
 * @function
 * @param {string} string 需要转义的字符串
 * @returns {string}
 */
function escapeSymbol (string = '') {
  return string
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * 转义HTML字符
 * @function
 * @param {string} string HTML字符
 * @returns {string}
 */
function escapeHTML (string) {
  return toString(string).replace(/&(?![\w#]+;)|[<>"']/g, escapeHTML.escapeFn)
}

/**
 * 转义资源
 * @type {Object}
 */
escapeHTML.SOURCES = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2f;'
}

/**
 * 转义函数
 * @param {string} name 转义字符
 * @returns {string}
 */
escapeHTML.escapeFn = function (name) {
  return escapeHTML.SOURCES[name]
}

/**
 * 获取元素在数组中所在位置的键值
 * @function
 * @param {array} array 数组
 * @param {*} value 要获取键值的元素
 * @returns {integer} 键值，不存在返回 -1;
 */
function indexOf (array, value) {
  if (Array.prototype.indexOf && is('Function')(array.indexOf)) {
    return array.indexOf(value)
  }
  else {
    for (let [i, l] = [0, array.length]; i < l; i ++) {
      if (array[i] === value) {
        return i
      }
    }

    return -1
  }
}

/**
 * inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @function
 * @param {Object|integer} query 对象或数字(数字用于数组下标)
 * @return {Integer}                  键值，不存在返回 -1;
 */
function inArrayBy (array, query, propName) {
  let index = is('Object')(query)
    ? query[propName]
    : query

  for (let [i, l] = [0, array.length]; i < l; i ++) {
    if (index == array[i][propName]) {
      return i
    }
  }

  return -1
}

/**
 * 遍历数组或对象
 * @function
 * @param {Array|Object} collection 需要遍历的结合
 * @param {Function} callback 回调函数
 */
function forEach (collection, callback = new Function) {
  if (is('Function')(callback)) {
    if (is('Array')(collection)) {
      if (Array.prototype.some) {
        collection.some(callback)
      }
      else {
        for (let [i, l] = [0, collection.length]; i < l; i ++) {
          if (true === callback(collection[i], i)) {
            break
          }
        }
      }
    }
    else if (is('Object')(collection)) {
      for (let i in collection) {
        if (true === callback(collection[i], i)) {
          break
        }
      }
    }
  }
}

/**
 * 数组去重
 * @function
 * @param {Array} array 需要去重数组
 * @return {Array}
 */
function unique (array) {
  let [n, r] = [{}, []]

  for (let i = array.length; i --;) {
    if (!n.hasOwnProperty(array[i])) {
      r.push(array[i])
      n[array[i]] = 1
    }
  }

  return r
}

/**
 * 集合过滤
 * @function
 * @param {Object|Array} collection 需要过滤的元素
 * @param {Function} callback 回调函数
 * @returns {Object|Array}
 */
function filter (collection, callback = new Function) {
  let isArr = is('Array')(collection),
      res   = isArr ? [] : {}

  forEach(collection, function (val, key) {
    if (callback(val, key)) {
      res[isArr ? res.length : key] = val
    }
  })

  return res
}

/**
 * 合并数组或对象
 * @function
 * @param {Array|Object} objectA 对象
 * @param {Array|Object} objectB 对象
 * @param {Array|Object} ... 对象
 * @returns {Array|Object} objectA 第一个传入的对象
 */
function extend (...args) {
  let [paramA, paramB] = [args[0], args[1]]

  if (args.length > 2) {
    paramA = extend(paramA, paramB)

    let next = Array.prototype.slice.call(args, 2)
    return extend.apply({}, [paramA].concat(next))
  }

  if (is('Array')(paramA) && is('Array')(paramB)) {
    Array.prototype.splice.apply(paramA, [paramA.length, 0].concat(paramB))
  }
  else if (is('Object')(paramA) && is('Object')(paramB)) {
    if (is('Function')(Object.assign)) {
      paramA = Object.assign(paramA, paramB);
    }
    else {
      for (let i in paramB) {
        paramA[i] = paramB[i]
      }
    }
  }

  return paramA
}

/**
 * 抛出异常
 * @function
 * @param {string|Object} error 错误异常
 * @param {boolean} type 是否捕获事件
 */
function __throw (error, type) {
  let message = ''

  let _throw = function (message) {
    setTimeout(function () {
      throw message
    })
  }

  if (is('Object')(error)) {
    forEach(error, function (value, name) {
      message += '<' + name.substr(0, 1).toUpperCase() + name.substr(1) + '>\n' + value + '\n\n'
    })
  }
  else if (is('String')(error)) {
    message = error
  }

  if ('log' === type) {
    is('Defined')(console) && is('Function')(console.error)
      ? console.error(message)
      : _throw(message)
  }
  else if ('catch' === type) {
    _throw(message)
  }

  return message
}

/**
 * 伪渲染函数
 * @function
 * @return {string} 空字符串
 */
function __render () {
  return ''
}

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
  // NodeJS
  else if ('object' === typeof exports) {
    module.exports = module
  }
  // no module definaction
  else {
    root[name] = module
  }
};
/**
 * Exports Module
 */
UMD('oTemplate', function() {
  return new OTemplate()
}, root)})(this);