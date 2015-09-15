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
  depends: []                       // addition render arguments (must be use `$` to define variable name)/追加渲染器的传值设定,默认拥有 $data (必须使用 `$` 作为起始字符来定义变量)
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
 * @description
 * 
 * Render and it's options will be cached together,
 * and they can not be modified by any operation.
 * If you want to replace or modify the options, u
 * must compile it again. And u can use options.overwrite
 * to overwrite it.
 * 
 * 渲染器的 options 将与渲染器一起缓存起来，且不会被
 * 外界影响，若要修改 options，则必须重新生成渲染器，
 * 可以设置 options.overwrite 为 true 来覆盖
 */
OTemplate.prototype.$compile = (function() {
  return function(source, options) {
    var self = this,
        origin = source,
        conf = extend({}, this._defaults, options),
        deps = conf.depends,
        _args_ = ['$data'].concat(deps).join(','),
        args = []

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

    var shell = this.$compileShell(source, conf)
    return buildRender({
      $source: source || '',
      $helpers: this._helpers || {},
      $blocks: this._blockHelpers || {}
    })

    function buildRender(scope) {
      var render

      try {
        render = new Function(_args_, shell)
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

      return function(data) {
        try {
          return render.apply(scope, [data].concat(args))
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
 * @description
 * 
 * 当渲染器已经被缓存的情况下，options 除 overwrite 外的所有属性均不会
 * 对渲染器造成任何修改；当 overwrite 为 true 的时候，缓存将被刷新，此
 * 时才能真正修改渲染器的配置
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
}