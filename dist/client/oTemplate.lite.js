~(function(root) {'use strict'
/**
 * @class OTemplate A Template engine for Javascript
 * @param {Object} options 配置
 *   @param {Menu}    env        [unit, develop, produce]
 *   @param {Boolean} noSyntax   是否使用使用原生语法
 *   @param {Boolean} strict     是否通过严格模式编译语法
 *   @param {Boolean} compress   压缩生成的HTML代码
 *   @param {String}  openTag    语法的起始标识
 *   @param {String}  closeTag   语法的结束标识
 *   @param {Array}   depends    追加渲染器的传值设定
 */
var OTemplate = function(options) {
  options = options || {}
  var self = this

  this._caches = {}                   // render caches/编译器缓存
  this._blocks = {}                   // block syntax/块状语法
  this._blockHelpers = {}             // block helpers/块状辅助函数
  this._helpers = {}                  // helpers/辅助函数
  this._defaults = {}                 // defualt config/默认配置

  // set the config/设置配置
  ~extend(this._defaults, OTemplate._defaults, options)

  // set any helpers/设置基础辅助函数
  ~extend(this._helpers, {
    $escape: (function() {
      var escapeHTML = {}
      escapeHTML.SOURCES = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2f;'
      }

      escapeHTML.escapeFn = function(name) {
        return escapeHTML.SOURCES[name]
      }

      escapeHTML.escape = function(content) {
        return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeHTML.escapeFn)
      }

      return function() {
        return escapeHTML.escape.apply(escapeHTML, arguments)
      }
    })(),
    $noescape: function(str) {
      return toString(str || '')
    },
    $toString: function(str, escape) {
      var conf = self._defaults,
          str = toString(str || '')

      return true === (isBoolean(escape) ? escape : conf.escape)
        ? self.helper('$escape')(str)
        : str
    },
    include: function(filename, data, options) {
      var node = document.getElementById(filename)
      if (node) {
        __throw({
          message: '[Include Error]: Template ID `' + filename + '` is not found.'
        })

        return ''
      }

      return self.render(node.innerHTML, data, options)
    }
  })

  // set any syntax/设置语法
  ~isArray(OTemplate._extends) && forEach(OTemplate._extends, function(_extends_) {
    self.extends(_extends_)
  })
}

OTemplate._defaults = {             // default options/默认配置
  env: 'produce',                   // current entironment/当前环境 [unit, develop, produce]
  noSyntax: false,                  // is use native syntax/是否使用使用原生语法
  strict: true,                     // compile syntax in strict mode/是否通过严格模式编译语法
  compress: true,                   // compress the html code/压缩生成的HTML代码
  escape: true,                     // escape the HTML/是否编码输出变量的 HTML 字符
  openTag: '{{',                    // open tag for syntax/起始标识
  closeTag: '}}',                   // close tag for syntax/结束标识
  depends: []                       // addition render arguments/追加渲染器的传值设定,默认拥有 $data
}

OTemplate._extends = []             // extens plugins/扩展集合

/**
 * @function extend 扩展库
 * @param  {Function}   _extends_ 扩展方法
 * @return {OTemplate}
 */
OTemplate.extend = function(_extends_) {
  isFunction(_extends_) && OTemplate._extends.push(_extends_)
  return this
}

/**
 * @function $$throw
 * @param  {String} error
 */
OTemplate.prototype.$$throw = function(message) {
  'unit' !== this._defaults.env && __throw(message)
}

/**
 * @function $$cache 缓存方法
 * @param  {String}   name   名称
 * @param  {Function} render 函数
 * @return {Function|OTemplate}
 */
OTemplate.prototype.$$cache = function(name, render) {
  var caches = this._caches
  if (arguments.length > 1) {
    caches[name] = render
    return this
  }

  return caches[name]
}

/**
 * @function $$table 给每行开头添加序列号/add the line number to the string
 * @param  {String} str 需要添加序列号的字符串
 * @return {String}
 */
OTemplate.prototype.$$table = (function() {
  return function(str) {
    var line = 0,
        match = str.match(/([^\n]*)?\n|([^\n]+)$/g)

    if (!match) {
      return line + ' | ' + str
    }

    var max = match.length
    return str.replace(/([^\n]*)?\n|([^\n]+)$/g, function($all) {
      return zeroize(++ line, max) + ' | ' + $all
    })
  }

  /**
   * @function zeroize 补零
   * @param  {Integer} num  需要补零的数字
   * @param  {Integer} max  补零参考数字易为最大补零数字
   * @param  {String}  zero 需要填补的 "零"
   * @return {String}
   */
  function zeroize(num, max, zero) {
    zero = zero || ' '
    num = num.toString()
    max = max.toString().replace(/\d/g, zero)

    var res = max.split('')
    res.splice(- num.length, num.length, num)
    return res.join('')
  }
})()

/**
 * @function $compileShell 编译脚本
 * @param  {String}   source 脚本模板
 * @param  {Object}   options 配置
 * @return {String}
 */
OTemplate.prototype.$compileShell = (function() {
  return function(source, options) {
    options = options || {}

    var conf = this._defaults,
        isEscape = isBoolean(options.escape) ? options.escape : conf.escape,
        strip = isBoolean(options.compress) ? options.compress : conf.compress,
        _helpers_ = this._helpers,
        _blocks_ = this._blockHelpers,
        helpers = [],
        blocks = [],
        variables = [],
        line = 1,
        buffer = ''

    /**
     * @function htmlToJs 解析HTML为JS字符串拼接
     * @param  {String} source HTML
     * @return {String}
     */
    var htmlToJs = function(source) {
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

      return '$buffer+="' + source + '";'
    }

    /**
     * @function shellToJs 解析脚本为JS字符串拼接
     * @param  {String} source JS shell
     * @return {String}
     */
    var shellToJs = function(source) {
      source = trim(source || '')

      // analyze and define variables
      forEach(getVariables(source), function(name) {
        if (!name) {
          return
        }

        var func = root[name]
        if (isFunction(func) && func.toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
          return
        }

        if (isFunction(_helpers_[name])) {
          helpers.push(name)
          return
        }

        if (isFunction(_blocks_[name])) {
          blocks.push(name)
          return
        }

        variables.push(name)
      })

      // echo
      if (/^=\s*[\w]+?\s*$/.exec(source)) {
        source = '$buffer+=$helpers.$toString(' + source.replace(/[=\s;]/g, '') + ', ' + isEscape + ');'
      }
      else {
        // no escape HTML code
        if (/^#\s*[\w]+?\s*$/.exec(source)) {
          source = '$buffer+=$helpers.$noescape(' + source.replace(/[#\s;]/g, '') + ');'
        }
        // escape HTML code
        else if (/^!#\s*[\w]+?\s*$/.exec(source)) {
          source = '$buffer+=$helpers.$escape(' + source.replace(/[!#\s;]/g, '') + ');'
        }
        // echo helper
        else if (/^\s*[\w\W]+\s*\([^\)]*?\)\s*$/.exec(source)) {
          source = '$buffer+=$helpers.$toString(' + source + ', ' + isEscape + ');'
        }
      }

      line += source.split(/\n/).length - 1
      source += (/\)$/.exec(source) ? ';' : '') + '$runtime=' + line +  ';'
      return source
    }

    source = (source || '')

    forEach(source.split('<%'), function(code) {
      code = code.split('%>')

      var p1 = code[0],
          p2 = code[1]

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
      buffer = 'var ' + name + '=$data.' + name + ';' + buffer
    })

    // define helpers
    forEach(unique(helpers), function(name) {
      buffer = 'var ' + name + '=$helpers.' + name + ';' + buffer
    })

    // define block helpers
    forEach(unique(blocks), function(name) {
      buffer = 'var ' + name + '=$blocks.' + name + ';' + buffer
    })

    // use strict
    buffer = 'try {'
      +        '"use strict";'
      +        'var $scope=this,$helpers=$scope.$helpers,$blocks=$scope.$blocks,$buffer="",$runtime=0;'
      +        buffer
      +        'return $buffer;'
      +      '}'
      +      'catch(err) {'
      +        'throw {'
      +          'Message: err.message,'
      +          'Line: $runtime,'
      +          'Shell: "' + escape(this.$$table(source)) + '"'
      +        '};'
      +      '}'

      +      'function $append(buffer) {'
      +        '$buffer += buffer;'
      +      '}'

    return buffer
  }

  /**
   * @function getVariables 获取变量名
   * @param  {String} source Shell
   * @return {Array}
   */
  function getVariables(source) {
    var KEYWORDS = [
      '$scope', '$helpers', '$blocks',
      '$data', '$buffer', '$runtime',
      '$append',

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

    var variables = source
      .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
      .replace(/[^\w$]+/g, ',')
      .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
      .split(/^$|,+/)

    return filter(variables, function(variable) {
      return -1 === KEYWORDS.indexOf(variable)
    })
  }
})()

/**
 * @function $compile 编译模板为函数
 * @param   {String}    tpl      模板
 * @param   {Object}    options  编译配置
 * @return  {Function}
 */
OTemplate.prototype.$compile = (function() {
  return function(source, options) {
    var self = this,
        origin = source,
        conf = extend({}, this._defaults, options),
        args = ['$data'].concat(conf.depends).join(',')

    if (true !== conf.noSyntax) {
      source = this.$compileSyntax(source, !!conf.strict)
    }

    var shell = this.$compileShell(source, conf)
    return buildRender({
      $source: source || '',
      $helpers: this._helpers || {},
      $blocks: this._blockHelpers || {}
    })

    function buildRender(scope) {
      var render

      try {
        render = new Function(args, shell)
      }
      catch(err) {
        __throw({
          message: '[Compile Render]: ' + err.message,
          line: 'Javascript syntax occur error, it can not find out the error line.',
          syntax: origin,
          template: source,
          shell: shell
        })

        render = __render
      }

      return function() {
        try {
          return render.apply(scope, arguments)
        }
        catch(err) {
          err = extend({}, err, {
            source: self.$$table(scope.$source)
          })

          __throw({
            message: '[Exec Render]: ' + err.message,
            line: err.line,
            template: err.source,
            shell: err.shell
          })
        }
      }
    }
  }
})()

/**
 * @function OTemplate 生成一个新的 OTemplate 制作对象
 * @param  {Object} options 配置
 * @return {OTemplate}
 */
OTemplate.prototype.OTemplate = function(options) {
  return new OTemplate(options)
}

/**
 * @function extends 扩展 OTemplate
 * @param  {Function} callback 回调
 * @return {OTemplate}
 */
OTemplate.prototype.extends = function(callback) {
  callback.call(this, this)
  return this
}

/**
 * @function config 查询与设置配置
 * @param {String|Object} var_query 设置/获取的配置值名称
 * @param {Anything}      value     需要配置的值 (optional)
 */
OTemplate.prototype.config = function(var_query, value) {
  if (1 < arguments.length) {
    if (isString(var_query)) {
      if ((var_query === 'openTag' && var_query === '<%') || (var_query === 'closeTag' && var_query === '%>')) {
        return this
      }

      this._defaults[var_query] = value
      return this
    }
  }

  var self = this
  if (isPlainObject(var_query)) {
    forEach(options, function(name, value) {
      self.config(name, value)
    })

    return this
  }

  if (isString(var_query)) {
    return this._defaults[var_query]
  }
}

/**
 * @function helper 查找/设置辅助函数
 * @param  {String|Object}  var_query 需要查找或设置的函数名|需要设置辅助函数集合
 * @param  {Function}       callback  回调函数
 * @return {OTemplate|Function}
 */
OTemplate.prototype.helper = function(var_query, callback) {
  if (1 < arguments.length) {
    if (isString(var_query) && isFunction(callback)) {
      this._helpers[var_query] = callback
    }
  }
  else {
    if (isString(var_query)) {
      return this._helpers[var_query]
    }

    if (isPlainObject(var_query)) {
      var name
      for (name in var_query) {
        this.helper(name, var_query[name])
      }
    }
  }

  return this
}

/**
 * @function unhelper 注销辅助函数
 * @param  {String} name 名称
 * @return {OTemplate}
 */
OTemplate.prototype.unhelper = function(name) {
  var helpers = this._helpers
  if (helpers.hasOwnProperty(name)) {
    delete helpers[name]
  }

  return this
}

/**
 * @function compile 编译模板
 * @param  {String} source  模板
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compile = function(source, options) {
  source = source.toString()

  var conf = extend({}, this._defaults, options),
      filename = conf.filename,
      render = true === conf.overwrite || this.$$cache(filename)

  if (isFunction(render)) {
    return render
  }

  render = this.$compile(source, conf)
  isString(filename) && this.$$cache(filename, render)
  return render
}

/**
 * @function render 渲染模板
 * @param  {String} source  模板
 * @param  {Object} data    数据
 * @param  {Object} options 配置
 * @return {String}
 */
OTemplate.prototype.render = function(source, data, options) {
  return this.compile(source, options)(data || {})
};
// 扩展新的 include 支持 ajax
OTemplate.extend(function() {
  var self = this

  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return self.renderById(filename, data, options)
    }
  })
})

/**
 * @function compileById 编译内联模板
 * @param  {String} id      模板ID
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compileById = function(id, options) {
  id = id.toString()

  var conf = extend({}, this._defaults, options, { filename: id }),
      render = true === conf.overwrite || this.$$cache(id)

  if (isFunction(render)) {
    return render
  }

  var node = document.getElementById(id)
  return node
    ? this.compile(node.innerHTML, conf)
    : (__throw({
        message: '[Compile Template]: Template ID `' + id + '` is not found.'
      }),
      __render)
}

/**
 * @function renderById 渲染内联模板
 * @param  {String} id      模板ID
 * @param  {Object} data    数据
 * @param  {Object} options 配置
 * @return {String}
 */
OTemplate.prototype.renderById = function(id, data, options) {
  var render = this.compileById(id, options)
  return render(data || {})
}

/**
 * @function compileByAjax 编译模板文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 *   @param {Function} render  渲染函数
 * @param  {Object}   options  配置
 */
OTemplate.prototype.compileByAjax = function(filename, callback, options) {
  if (!isFunction(callback)) {
    return
  }

  var self = this,
      conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(filename)

  isFunction(render)
    ? callback(render)
    : this.readFile(filename, function(source) {
        var _source = source,
            requires = [],
            match

        while(match = /<%\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")((,\s*([\w]+|\{[\w\W]+\})\s*)*)\s*\)\s*%>/.exec(_source)) {
          requires.push(match[3])
          _source = _source.replace(match[0], '')
        }

        var total = requires.length
        var __exec = function() {
          0 >= (-- total) && __return()
        }

        var __return = function() {
          render = self.$compile(source)
          self.$$cache(filename, render)
          callback(render)
          total = undefined
        }

        if (total > 0) {
          forEach(unique(requires), function(file) {
            self.$$cache(file)
              ? __exec()
              : self.compileByAjax(file, __exec, extend(conf, { overwrite: false }))
          })
        }
        else {
          __return()
        }
      })
}

/**
 * @function renderByAjax 渲染模板文件
 * @param  {String}   filename 文件名
 * @param  {Object}   data     数据
 * @param  {Function} callback 回调函数
 *   @param {String} html 渲染结果HTML
 * @param  {Object}   options  配置
 */
OTemplate.prototype.renderByAjax = function(filename, data, callback, options) {
  if (isFunction(data)) {
    return this.renderByAjax(filename, {}, data, callback)
  }

  isFunction(callback) && this.compileByAjax(filename, function(render) {
    callback(render(data || {}))
  }, options)
}

/**
 * @function readFile 读取文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
OTemplate.prototype.readFile = function(filename, callback, errorCallback) {
  if (!isFunction(callback)) {
    return
  }

  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    var status = this.status
    if (this.DONE === this.readyState) {
      200 <= status && status < 400 && callback(this.responseText)
    }
  }

  xhr.onerror = function() {
    var err = {
      message: '[Compile Template]: Request file `' + filename + '` some error occured.',
      filename: filename,
      response: '[Reponse State]: ' + this.status
    }

    __throw(err)
    isFunction(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.ontimeout = function() {
    var err = {
      message: '[Request Template]: Request template file `' + filename + '` timeout.',
      filename: filename
    }

    __throw(err)
    isFunction(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.onabort = function() {
    var err = {
      message: '[Request Template]: Bowswer absort the request.',
      filename: filename
    }

    __throw(err)
    isFunction(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.open('GET', filename, true)
  xhr.send(null)
}
;
/**
 * @function inline 所在行
 * @param  {String} str
 * @param  {Number} pos
 * @return {Number}
 */
function inline(str, pos) {
  return (str.substr(0, pos).match(/\n/g) || []).length +1
}

/**
 * @function type 获取对象的类型
 * @param  {Anything} a 获取的对象
 * @return {String}
 */
function type(a) {
  return Object.prototype.toString.call(a);
}

/**
 * @function isDefined 是否不为 undefined
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isDefined(a) {
  return 'undefined' !== typeof a
}

/**
 * @function isUndefined 是否为 undefined
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isUndefined(a) {
  return 'undefined' === typeof a
}


/**
 * @function isObject 是否为对象
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isObject(a) {
  return '[object Object]' === type(a)
}

/**
 * @function isFunction 是否为函数
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isFunction(a) {
  return '[object Function]' === type(a)
}

/**
 * @function isNumber 是否为一个数字对象
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isNumber(a) {
  return '[object Number]' === type(a)
}

/**
 * @function isBoolean 是否为一个布尔值
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isBoolean(a) {
  return '[object Boolean]' === type(a)
}

/**
 * @function isString 是否为一个字符串
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isString(a) {
  return '[object String]' === type(a)
}

/**
 * @function isRegExp 判断是否为正则
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isRegExp(a) {
  return '[object RegExp]' === type(a)
}

/**
 * @function isArray 是否为数组
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isArray(a) {
  return '[object Array]' === type(a)
}

/**
 * @function isInteger 是否为整数
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isInteger(a) {
  var y = parseInt(a, 10)
  return !isNaN(y) && a === y && a.toString() === y.toString()
}

/**
 * @function isPlainObject 是否为一个纯对象
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isPlainObject(o) {
    var ctor,
        prot

    if (false === isObject(o) || isUndefined(o)) {
        return false
    }

    ctor = o.constructor
    if ('function' !== typeof ctor) {
        return false
    }
    
    prot = ctor.prototype;
    if (false === isObject(prot)) {
        return false
    }
    
    if (false === prot.hasOwnProperty('isPrototypeOf')) {
        return false
    }
    
    return true
}

/**
 * @trim 去除空格
 * @param  {String}     str
 * @return {String}
 */
function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

/**
 * @function namespace 查找对象中的属性
 * @param  {String}     query
 * @param  {Object}     space 获取的对象
 * @param  {String}     token 分割 token
 * @return {Anything} 若不存在返回 undefined，若存在则返回该指向的值
 * 
 * @example
 *     {a:{a:{a:{a:1}}}} -> $.namespace('a.a.a.a') -> 1
 *     {a:1}             -> $.namespace('a.a.a.a') -> undefined
 */
function namespace(query, space, token) {
  if (!isString(query)) {
    return undefined
  }

  var re = space,
      ns = query.split(token || '.'),
      i = 0,
      l = ns.length

  for (; i < l; i ++) {
    if (isUndefined(re[ns[i]])) {
        return undefined
    }

    re = re[ns[i]]
  }

  return isUndefined(re) ? undefined : re
}

/**
 * @function toString 强制转化成字符串
 * @param  {Anything} value 传入的值
 * @return {String}
 */
function toString(value) {
  if (isString(value)) {
    return value
  }

  if (isNumber(value)) {
    return value += ''
  }

  if (isFunction(value)) {
    return toString(value.call(value))
  }

  return ''
}

/**
 * @function escape 转义
 * @param  {String} a 需要转义的字符串
 * @return {String}
 */
function escape(a) {
  return a
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * @function forEach 遍历数组或对象
 * @param {Array|Object}  a        数组或对象
 * @param {Function}      callback 回调函数
 */
function forEach(a, callback) {
  if (isFunction(callback)) {
    var i
    if (isArray(a)) {
      if (Array.prototype.some) {
        a.some(callback)
      }
      else {
        var l = a.length
        for (i = 0; i < l; i ++) {
          if (true === callback(a[i], i)) {
            break
          }
        }
      }
    }
    else if (isObject(a)) {
      for (i in a) {
        if (true === callback(a[i], i)) {
          break
        }
      }
    }
  }
}

/**
 * @function unique 去重
 * @param  {Array} a 需要去重数组
 * @return {Array}
 */
function unique(a) {
  var n = {},
      r = [],
      i = a.length

  for (;i --;) {
    if (!n.hasOwnProperty(a[i])) {
      r.push(a[i])
      n[a[i]] = 1
    }
  }

  return r
}

/**
 * @function filter 过滤
 * @param  {Object|Array}   collection  需要过滤的元素
 * @param  {Function}       callback    回调函数
 * @return {Object|Array}
 */
function filter(collection, callback) {
  var isArr = isArray(collection),
      res = isArr ? [] : {}

  forEach(collection, function(val, key) {
    if (callback(val, key)) {
      res[isArr ? res.length : key] = val
    }
  })

  return res
}

/**
 * @function extend 合并数组或对象
 * @param  {Array|Object} a 数组或对象
 * @param  {Array|Object} b 数组或对象
 * @return {Array|Object} 返回 a 元素
 */
function extend(a, b) {
  if (arguments.length > 2) {
    a = extend(a, b)
    var next = Array.prototype.slice.call(arguments, 2, arguments.length)
    return extend(a, next[0])
  }

  if (isArray(a) && isArray(b)) {
    Array.prototype.splice.apply(a, [a.length, 0].concat(b))
  }
  else if (isPlainObject(a) && isPlainObject(b)) {
    for (var i in b) {
      a[i] = b[i]
    }
  }

  return a
}

/**
 * @function __throw 抛出异常
 * @param  {String|Object} error 错误异常
 */
function __throw(error) {
  if (isDefined(console) && isFunction(console.error)) {
    var message = ''
    if (isObject(error)) {
      forEach(error, function(value, name) {
        message += '<' + name.substr(0, 1).toUpperCase() + name.substr(1) + '>\n' + value + '\n\n'
      })
    }
    else if (isString(error)) {
      message = error
    }

    console.error(message)
  }
}

/**
 * @function __render 伪渲染函数
 * @return {String}
 */
function __render() {
  return ''
}

/**
 * @function UMD
 * @param {windows|global} root
 * @param {Function} factory
 */
function UMD(name, factory, root) {
  'function' === typeof define
    // AMD & CMD
    ? define(function() {
        return factory(root)
      })
    : 'object' === typeof exports
      // nodejs
      ? module.exports = factory(root)
      // no module definaction
      : root[name] = factory(root)
};
// Exports
UMD('oTemplate', function() {
  return new OTemplate()
}, root)})(this);