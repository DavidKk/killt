/**
 * @class OTemplate 模板引擎
 * @param {Object} options 配置
 *   @param {Menu}    env        [unit, develop, produce]
 *   @param {Boolean} noSyntax   是否使用使用原生语法
 *   @param {Boolean} strict     是否通过严格模式编译语法
 *   @param {Boolean} compress   压缩生成的HTML代码
 *   @param {String}  openTag    语法的起始标识
 *   @param {String}  closeTag   语法的结束标识
 *   @param {Boolean} cache      是否缓存编译过的模板
 *   @param {Array}   depends    追加渲染器的传值设定
 */
var OTemplate = function(options) {
  options = options || {}

  this._caches = {}                   // render caches/编译器缓存
  this._blocks = {}                   // block syntax/块状语法
  this._blockHelpers = {}             // block helpers/块状辅助函数
  this._helpers = {}                  // helpers/辅助函数
  this._defaults = {}                 // defualt config/默认配置

  // set the config/设置配置
  extend(this._defaults, OTemplate._defaults, options)

  // set any syntax/设置语法
  isFunction(OTemplate._extends) && this.extends(OTemplate._extends)

  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return this.render(filename, data, options)
    },
    each: function(data, callback) {
      forEach(data, callback)
    },
    escape: (function() {
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
        return this.SOURCES[name]
      }

      escapeHTML.escape = function(content) {
        return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, this.escapeFn)
      }

      return function() {
        return escapeHTML.escape.apply(escapeHTML, arguments)
      }
    })()
  })
}

OTemplate._defaults = {             // 默认配置
  env: 'produce',                   // 当前环境 [unit, develop, produce]
  noSyntax: false,                  // is use origin js syntax/是否使用使用原生语法
  strict: true,                     // compile syntax in strict mode/是否通过严格模式编译语法
  compress: true,                   // compress the html code/压缩生成的HTML代码
  openTag: '{{',                    // 起始标识
  closeTag: '}}',                   // 结束标识
  cache: true,                      // cache the compiled template/是否缓存编译过的模板
  depends: []                       // add render arguments/追加渲染器的传值设定,默认拥有 $data
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
 * @param  {String} str 
 * @return {String}
 */
OTemplate.prototype.$$table = function(str) {
  var line = 0
  return str.replace(/([^\n]*)?\n|([^\n]+)$/g, function($all) {
    return (++ line) + ':' + $all
  })
}

/**
 * @function $compileShell 编译脚本
 * @param  {String}   source 脚本模板
 * @param  {Boolean}  strict 严格模式
 * @return {String}
 */
OTemplate.prototype.$compileShell = function(source, strip) {
  strip = isBoolean(strip) ? strip : this._defaults.compress

  var _helpers_ = this._helpers,
      _blocks_ = this._blockHelpers,
      helpers = [],
      blocks = [],
      variables = [],
      line = 1,
      buffer = ''

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

  // define helpers and variables
  forEach(unique(variables), function(name) {
    buffer = 'var ' + name + '=$data.' + name + ';' + buffer
  })

  forEach(unique(helpers), function(name) {
    buffer = 'var ' + name + '=$helpers.' + name + ';' + buffer
  })

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
    +          'message: err.message,'
    +          'line: $runtime,'
    +          'shell: "' + escape(this.$$table(source)) + '"'
    +        '};'
    +      '}'

    +      'function $append(buffer) {'
    +        '$buffer += buffer'
    +      '}'

  return buffer

  /**
   * @function htmlToJs 解析HTML为JS字符串拼接
   * @param  {String} source HTML
   * @return {String}
   */
  function htmlToJs(source) {
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
  function shellToJs(source) {
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
      source = '$buffer+=(' + source.replace(/[=\s;]/g, '') + ')||"";'
    }
    // echo helper
    else if (/^\s*\w+\s*\([^\)]*?\)\s*$/.exec(source)) {
      source = '$buffer+=' + source + '||"";'
    }

    line += source.split(/\n/).length - 1
    source += '$runtime=' + line +  ';'
    return source
  }

  /**
   * @function getVariables 获取变量名
   * @param  {String} source Shell
   * @return {Array}
   */
  function getVariables(source) {
    var KEYWORDS = [
      '$data', '$helper', '$buffer', '$runtime',
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

    return variables.filter(function(variable) {
      return -1 === KEYWORDS.indexOf(variable)
    })
  }
}

/**
 * @function $compile 编译模板为函数
 * @param   {String}    tpl      模板
 * @param   {Object}    options  编译配置
 * @return  {Function}
 */
OTemplate.prototype.$compile = function(source, options) {
  var origin = source,
      conf = extend({}, this._defaults, options),
      args = ['$data'].concat(conf.depends).join(',')

  if (true !== conf.noSyntax) {
    source = this.$compileSyntax(source, !!conf.strict)
  }

  var shell = this.$compileShell(source)
  return buildRender(shell, args, {
    $source: this.$$table(origin),
    $helpers: this._helpers,
    $blocks: this._blockHelpers
  })

  function buildRender(shell, args, scope) {
    var render
    try {
      render = new Function(args, shell)
    }
    catch(err) {
      __throw({
        message: '[Build Render]: ' + err.message,
        line: 'Anonymous function can not find out the error line.',
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
          source: scope.$source
        })

        __throw({
          message: '[Exec Render]: ' + err.message,
          line: err.line,
          source: err.source,
          shell: err.shell
        })
      }
    }
  }
}

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
 * @function block 查询/设置块级辅助函数
 * @param  {String|Object}  var_query 需要查找或设置的函数名|需要设置辅助函数集合
 * @param  {Function}       callback  回调函数
 * @return {OTemplate|Function}
 */
OTemplate.prototype.block = function(var_query, callback) {
  if (1 < arguments.length) {
    if (isString(var_query) && isFunction(callback)) {
      this
        .$registerSyntax(var_query + 'open', var_query + '\\s*([^<%= closeTag %>]*?)\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', var_query + '($1, function($3$4) {')
        .$registerSyntax(var_query + 'close', '/' + var_query, '}, $append);')
        ._blockHelpers[var_query] = callback
    }
  }
  else {
    if (isString(var_query)) {
      return this._blockHelpers[var_query]
    }

    if (isPlainObject(var_query)) {
      var name
      for (name in var_query) {
        this.block(name, var_query[name])
      }
    }
  }

  return this
}

/**
 * @function $unregisterSyntax 注销块级辅助函数
 * @param  {String} name 名称
 * @return {OTemplate}
 */
OTemplate.prototype.unblock = function(name) {
  var blocks = this._blockHelpers

  if (helpers.hasOwnProperty(name)) {
    delete helpers[name]
    delete blocks[name + 'open']
    delete blocks[name + 'close']
  }

  return this
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
 * @function helper 注销辅助函数
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
  var conf = extend({}, this._defaults, options),
      cache = conf.cache,
      filename = conf.filename,
      render

  if (true === cache && isString(filename)) {
    render = this.$$cache(filename)
    if (isFunction(render)) {
      return render
    }

    render = this.$compile(source, conf)
    this.$$cache(filename, source)
    return render
  }

  return this.$compile(source, conf)
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

/**
 * @function compileTpl 编译内联模板
 * @param  {String} id      模板ID
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compileTpl = function(id, options) {
  var tpl = document.getElementById(id)
  return tpl
    ? this.compile(tpl.innerHTML, {
        filename: id,
      }, options)
    : __throw({
        message: '[Compile Template]: template `' + id + '` is not found.'
      }) || __render
}

/**
 * @function renderTpl 渲染内联模板
 * @param  {String} id      模板ID
 * @param  {Object} data    数据
 * @param  {Object} options 配置
 * @return {String}
 */
OTemplate.prototype.renderTpl = function(id, data, options) {
  var render = this.compileTpl(id, options)
  return render(data || {})
}

/**
 * @function compileFile 编译模板文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 *   @param {Function} render  渲染函数
 * @param  {Object}   options  配置
 */
OTemplate.prototype.compileFile = function(filename, callback, options) {
  if (!isFunction(callback)) {
    return
  }

  var self = this,
      conf = extend({}, this._defaults, options),
      cache = conf.cache,
      render

  if (true === cache) {
    render = this.$$cache(filename)

    if (isFunction(render)) {
      callback(render)
    }
    else {
      readFile(filename, function(source) {
        render = self.$compile(source)
        self.$$cache(filename, render)
        callback(render)
      })
    }
  }
  else {
    render = self.$compile(source)
    callback(render)
  }
}

/**
 * @function renderFile 渲染模板文件
 * @param  {String}   filename 文件名
 * @param  {Object}   data     数据
 * @param  {Function} callback 回调函数
 *   @param {String} html 渲染结果HTML
 * @param  {Object}   options  配置
 */
OTemplate.prototype.renderFile = function(filename, data, callback, options) {
  return this.compileFile(filename, function(render) {
    callback(render(data || {}))
  }, options)
}