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
  extend(this._defaults, OTemplate._defaults, options)

  // set any syntax/设置语法
  isFunction(OTemplate._extends) && this.extends(OTemplate._extends)

  // set any helpers/设置基础辅助函数
  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return self.renderTpl(filename, data, options)
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

OTemplate._defaults = {             // default options/默认配置
  env: 'produce',                   // current entironment/当前环境 [unit, develop, produce]
  noSyntax: false,                  // is use native syntax/是否使用使用原生语法
  strict: true,                     // compile syntax in strict mode/是否通过严格模式编译语法
  compress: true,                   // compress the html code/压缩生成的HTML代码
  openTag: '{{',                    // open tag for syntax/起始标识
  closeTag: '}}',                   // close tag for syntax/结束标识
  depends: []                       // addition render arguments/追加渲染器的传值设定,默认拥有 $data
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
OTemplate.prototype.$$table = function(str) {
  var line = 0,
      match = str.match(/([^\n]*)?\n|([^\n]+)$/g)

  if (!match) {
    return line + ' | ' + str
  }

  var max = match.length
  return str.replace(/([^\n]*)?\n|([^\n]+)$/g, function($all) {
    return zeroize(++ line, max) + ' | ' + $all
  })

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

    return filter(variables, function(variable) {
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
}

/**
 * @function compileTpl 编译内联模板
 * @param  {String} id      模板ID
 * @param  {Object} options 配置
 * @return {Function}
 */
OTemplate.prototype.compileTpl = function(id, options) {
  id = id.toString()

  var conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(id)

  if (isFunction(render)) {
    return render
  }

  var node = document.getElementById(id)
  return node
    ? this.compile(node.innerHTML, { filename: id }, conf)
    : __throw({ message: '[Compile Template]: template `' + id + '` is not found.' }) || __render
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
      render = true === conf.overwrite || this.$$cache(filename)

  isFunction(render)
    ? callback(render)
    : readFile(filename, function(source) {
        var _source = source,
            requires = [],
            match

        while(match = /include\s*\([\"\']([\w\/\.]+)[\"\']?\s*(,\s*\{[^\}]+\})\)/g.exec(_source)) {
          requires.push(match[1])
          _source = _source.replace(match[0], '')
        }

        var total = requires.length
        total > 0
          ? forEach(requires, function(file) {
              self.compileFile(file, function() {
                0 >= (-- total) && __return()
              }, extend(conf, { overwrite: false }))
            })
          : __return()

        function __return() {
          render = self.$compile(source)
          self.$$cache(filename, render)
          callback(render)
        }
      })
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
  if (isFunction(data)) {
    return this.renderFile(filename, {}, data, callback)
  }

  isFunction(callback) && this.compileFile(filename, function(render) {
    callback(render(data || {}))
  }, options)
};
/**
 * Syntax Module - 语法模块
 * @description
 * 该模块主要提供一系列方法和基础语法供使用者更为简洁编写模板和自定义扩展语法
 * 你可以通过 `$registerSyntax` 方法来扩展自己所需求的语法；
 * 同时，现有的默认语法均可以通过 `$unregisterSyntax` 方法进行删除或清空，
 * 使用者可以拥有完全自主的控制权，但是语法最终必须替换成原生语法 (以 `<%` 和 `%>` 为包裹标记)
 * 其包裹内容是 Javascript 代码，你可以通过 `block` `helper` 为模板渲染时创建
 * 需要的辅助函数。
 * 
 * 自定义语法需注意：
 * 1. 正则表达式之间最好不要具有优先次序
 * 2. 注意贪婪模式与非贪婪模式的选择
 */
OTemplate._defaults = extend(OTemplate._defaults, {
  noSyntax: false
})

/**
 * @function $$compile 通过配置作为数据来替换模板
 * @param  {String} source  模板
 * @param  {Object} data    数据 (optional)，若数据不为 object 则设为默认配置数据
 * @return {String}
 * @description
 * 
 * '<%= openTag %>hi<%= closeTag %>'
 * if my defauts is { openTag: '{{', closeTag: '}}' }
 * the result is '{{hi}}'
 */
OTemplate.prototype.$$compile = function(source, data) {
  data = isPlainObject(data) ? data : this._defaults
  return source.replace(/<%=\s*([^\s]+)?\s*%>/igm, function(all, $1) {
    return namespace($1, data) || ''
  })
}

/**
 * @function $$compileRegexp 通过配置作为数据和模板生成 RegExp
 * @param   {String}  patternTpl regexp 模板
 * @param   {Menu}    attributes {igm}
 * @return  {RegExp}
 * @description
 *
 * '<%= openTag %>hi<%= closeTag %>'
 * if my defauts is { openTag: '{{', closeTag: '}}' }
 * replace string to '{{hi}}'
 * the return result is /{{hi}}/
 */
OTemplate.prototype.$$compileRegexp = function(patternTpl, attributes) {
  var pattern = this.$$compile(patternTpl)
  return new RegExp(pattern, attributes)
}

/**
 * @function $registerSyntax 注册语法
 * @param  {String}                      name         语法名称
 * @param  {String|Array|Object|RegExp}  var_syntax   语法正则 (请注意贪婪与贪婪模式)，当为 RegExp时，记得用 openTag 和 closeTag 包裹
 * @param  {String|Function}             shell        元脚本, 当为 Function 时记得加上 `<%` 和 `%>` 包裹
 * @return {OTemplate}
 * @description
 *
 * '(\\\w+)' will be compiled to /{{(\\\w+)}}/igm
 * but please use the non-greedy regex, and modify it to'(\\\w+)?'
 * eg. when it wants to match '{{aaa}}{{aaa}}', it will match whole string
 * not '{{aaa}}'
 *
 * '(\\\w+)' 将会编译成 /{{\\\w+}}/igm
 * 但是这个正则是贪婪匹配，这样会造成很多匹配错误，我们必须将其改成 '(\\\w+)?'
 * 例如匹配 '{{aaa}}{{aaa}}' 的是否，贪婪匹配会将整个字符串匹配完成，而不是 '{{aaa}}'
 */
OTemplate.prototype.$registerSyntax = function(name, var_syntax, shell) {
  var self = this

  if (2 < arguments.length) {
    this._blocks[name] = {
      syntax: isRegExp(var_syntax) ? var_syntax : this.$$compileRegexp('<%= openTag %>' + var_syntax + '<%= closeTag %>', 'igm'),
      shell: isFunction(shell) ? shell : '<%' + this.$$compile(shell) + '%>'
    }
  }
  else if (isPlainObject(var_syntax)) {
    forEach(var_syntax, function(shell, syntax) {
      self.$registerSyntax(name, syntax, shell)
    })
  }
  else if (isArray(var_syntax)) {
    forEach(var_syntax, function(compiler) {
      isString(compiler.syntax)
      && isString(compiler.shell) || isFunction(compiler.shell)
      && self.$registerSyntax(name, compiler.syntax, compiler.shell)
    })
  }

  return this
}

/**
 * @function $unregisterSyntax 销毁语法
 * @param  {String}     name 语法名称
 * @return {OTemplate}
 */
OTemplate.prototype.$unregisterSyntax = function(name) {
  var blocks = this._blocks
  if (blocks.hasOwnProperty(name)) {
    delete blocks[name]
  }

  return this
}

/**
 * @function $clearSyntax 清除所有语法
 * @param  {String} source 语法模板
 * @return {String}
 */
OTemplate.prototype.$clearSyntax = function(source) {
  var regexp = this.$$compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm')
  return source.replace(regexp, '')
}

/**
 * @function $analyzeSyntax 分析语法是否合格
 * @param  {String}   source    语法模板
 * @param  {Boolean}  compile   是否需要编译
 * @return {String|Boolean}
 */
OTemplate.prototype.$analyzeSyntax = function(source, compile) {
  compile = !(false === compile)

  var tpl = source
  if (compile) {
    forEach(this._blocks, function(handle) {
      tpl = tpl.replace(handle.syntax, '')
    })
  }

  // 语法错误，缺少闭合
  var tagReg = this.$$compileRegexp('<%= openTag %>|<%= closeTag %>', 'igm'),
      stripTpl = this.$clearSyntax(tpl)
      pos = stripTpl.search(tagReg)

  if (-1 !== pos) {
    var line = inline(stripTpl, pos)

    return {
      message: '[Syntax Error]: Syntax error in line ' + line + '.',
      template: this.$$table(source)
    }
  }

  // 语法错误，没有匹配到相关语法
  var syntaxReg = this.$$compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm'),
      match = source.match(syntaxReg)

  if (match) {
    var pos = tpl.search(syntaxReg),
        line = inline(tpl, pos)

    return {
      message: '[Syntax Error]: `' + match[0] + '` did not match any syntax in line ' + line + '.',
      template: this.$$table(tpl)
    }
  }

  return true
}

/**
 * @function $compileSyntax 编译语法模板
 * @param  {String}   source  语法模板
 * @param  {Boolean}  strict  是否为严格模式,
 *                            若不为 false 编译时会验证语法正确性若不正确则返回空字符串;
 *                            若为 false 模式则会去除所有没有匹配到的语法,
 *                            默认为 true，除 false 之外所有均看成 true
 * @return {String}
 * @example
 * 
 * Strict Mode
 * =============
 * 
 * Template:
 *   {{no-register}}
 *     <div></div>
 *   {{/no-register}}
 *
 * when strict not equal false, it will return '',
 * when strict equal false, it will return '<div></div>'
 */
OTemplate.prototype.$compileSyntax = function(source, strict) {
  strict = !(false === strict)

  var conf = this._defaults,
      valid

  forEach(this._blocks, function(handle) {
    source = source.replace(handle.syntax, handle.shell)
  })

  // 检测一下是否存在未匹配语法
  return strict ? (true === (valid = this.$analyzeSyntax(source, false)) ? source : (this.$$throw(valid) || '')) : this.$clearSyntax(source)
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
        .$registerSyntax(var_query + 'open', '(' + var_query + ')\\s*([\\w\\s,\\\"\\\']+)?\\s*(:\\s*([,\\w\\s]+)?)?', '$1($2, $append, function($4) {var $buffer="";')
        .$registerSyntax(var_query + 'close', '/' + var_query, 'return $buffer;});')
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
;
/**
 * Simple Syntax Defination/定义简单语法
 * @description
 * `if`:      {{if true}}...{{elseif}}...{{else}}...{{/if}}
 * `each`:    {{each data as value,key}}...{{/each}}
 * `include`: {{include "/templates/index.html", data}}
 * `escape`:  {{# "<div></div>"}}
 * `helper`:  {{data | helperA:dataA,dataB,dataC | helperB:dataD,dataE,dataF}}
 */
OTemplate._extends = function() {
  var HELPER_SYNTAX = '\\s*([^\\s\\|]+)?\\s*\\|\\s*([\\w]+)?(:([,\\w]+)?)?(.*)',
      HELPER_REGEXP = this.$$compileRegexp(HELPER_SYNTAX)

  this
    .$registerSyntax('echo', '@\\s*([^<%= closeTag %>]+)?\\s*', '=$1')
    .$registerSyntax('ifopen', 'if\\s*(.+)?\\s*', 'if($1) {')
    .$registerSyntax('else', 'else', '} else {')
    .$registerSyntax('elseif', 'else\\s*if\\s*(.+)?\\s*', '} else if($1) {')
    .$registerSyntax('ifclose', '\\/if', '}')
    .$registerSyntax('eachopen', 'each\\s*([^\\s]+)?\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', 'each($1, function($3$4) {')
    .$registerSyntax('eachclose', '\\/each', '})')
    .$registerSyntax('include', 'include\\s*([^\\s,]+)?\\s*(,\\s*[^\\s+]+)?\\s*', 'include($1$2)')
    .$registerSyntax('escape', '#\\s*([^\\s]+)?\\s*', 'escape($1)')
    .$registerSyntax('helper', HELPER_SYNTAX, (function() {
        return function($all, $1, $2, $3, $4, $5) {
          var str = format.apply(this, arguments)
          while(HELPER_REGEXP.exec(str)) {
            str = str.replace(HELPER_REGEXP, format)
          }

          return '<%' + str + '%>'
        }

        function format($all, $1, $2, $3, $4, $5) {
          return $2 + '(' + $1 + ($4 ? ',' + $4 : '') + ')' + ($5 ? $5.replace(/^\s*$/, '') : '')
        }
      })())

  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
};
// Exports
UMD('oTemplate', function() {
  return new OTemplate()
}, root);
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
 * @function isString 是否为一个字符串
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isString(a) {
  return '[object String]' === type(a)
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
 * @function isNumber 是否为一个数字对象
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isNumber(a) {
  return '[object Number]' === type(a)
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
 * @function isArray 是否为数组
 * @param  {Anything} a 需要判断的对象
 * @return {Boolean}
 */
function isArray(a) {
  return '[object Array]' === type(a)
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
        message += '<' + name + '>\n' + value + '\n\n'
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
var fs = require('fs')

/**
 * @function readFile 读取文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
function readFile(filename, callback) {
  if (isFunction(callback)) {
    fs.readFile(filename, function(err, buffer) {
      callback(buffer.toString())
    })
  }
}})(this);