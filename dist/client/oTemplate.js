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
  this._sourceHelpers = {}            // source helpers/资源辅助函数
  this._helpers = {}                  // helpers/辅助函数
  this._defaults = {}                 // defualt config/默认配置
  this._listeners = []                // event listener/事件监听方法

  // set the config/设置配置
  ~extend(this._defaults, OTemplate._defaults, options)

  // set any helpers/设置基础辅助函数
  ~extend(this._helpers, {
    $escape: function() {
      return escapeHTML.apply(escapeHTML, arguments)
    },
    $noescape: function(str) {
      return toString(str || '')
    },
    $toString: function(str, isEscape) {
      var conf = self._defaults,
          str = toString(str)

      return true === (is('Boolean')(isEscape) ? isEscape : conf.escape)
        ? self.helper('$escape')(str)
        : str
    },
    include: function(filename, data, options) {
      var conf = self._defaults,
          node = document.getElementById(filename)

      if (node) {
        self.$$throw({
          message: '[Include Error]: Template ID `' + filename + '` is not found.'
        })

        return ''
      }

      return self.render(node.innerHTML, data, options)
    }
  })

  // set any syntax/设置语法
  ~is('Array')(OTemplate._extends) && forEach(OTemplate._extends, function(_extends_) {
    self.extends(_extends_)
  })
}

OTemplate.ENV = OTemplate.prototype.ENV = {   // current envirment/配置环境
  PRODUCE: 1,                                 // production env/生产环境
  DEVELOP: 2,                                 // develop env/开发环境
  UNIT: 3                                     // unit test env/单元测试环境
}

OTemplate._defaults = {                       // default options/默认配置
  env: OTemplate.ENV.PRODUCE,                 // current entironment/当前环境 [unit, develop, produce]
  noSyntax: false,                            // is use native syntax/是否使用使用原生语法
  strict: true,                               // compile syntax in strict mode/是否通过严格模式编译语法
  compress: true,                             // compress the html code/压缩生成的HTML代码
  escape: true,                               // escape the HTML/是否编码输出变量的 HTML 字符
  openTag: '{{',                              // open tag for syntax/起始标识
  closeTag: '}}',                             // close tag for syntax/结束标识
  depends: []                                 // addition render arguments (must be use `$` to define variable name)/追加渲染器的传值设定,默认拥有 $data (必须使用 `$` 作为起始字符来定义变量)
}

OTemplate._extends = []                       // extens plugins/扩展集合

/**
 * @function extend 扩展库
 * @param  {Function}   _extends_ 扩展方法
 * @return {OTemplate}
 */
OTemplate.extend = function(_extends_) {
  is('Function')(_extends_) && OTemplate._extends.push(_extends_)
  return this
}

/**
 * @function $$throw
 * @param  {String} error
 */
OTemplate.prototype.$$throw = function(message, options) {
  var conf = extend({}, this._defaults, options),
      err = __throw(message, conf.env === OTemplate.ENV.UNIT && 'catch')

  forEach(this._listeners, function(listener) {
    'error' === listener.type && listener.handle(err)
  })
}

/**
 * @function on 添加监听事件
 * @param  {String}   type   监听类型
 * @param  {Function} handle 监听函数
 * @return {OTemplate}
 */
OTemplate.prototype.on = function(type, handle) {
  if (is('String')(type) && is('Function')(handle)) {
    this._listeners.push({
      type: type,
      handle: handle
    })
  }

  return this
}

/**
 * @function off 撤销监听事件
 * @param  {Function} handle 监听函数
 * @return {OTemplate}
 */
OTemplate.prototype.off = function(handle) {
  if (is('Function')(handle)) {
    var index = inArrayBy(handle, this._listeners, 'handle')
    -1 !== index && this._listeners.splice(index, 1)
  }

  return this
}

/**
 * @function onError 添加错误事件监听
 * @param  {Function} handle 监听函数
 * @return {OTempalte}
 */
OTemplate.prototype.onError = function(handle) {
  return this.on('error', handle)
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

    var origin = source,
        conf = this._defaults,
        isEscape = is('Boolean')(options.escape) ? options.escape : conf.escape,
        strip = is('Boolean')(options.compress) ? options.compress : conf.compress,
        _helpers_ = this._helpers,
        _blocks_ = this._blockHelpers,
        _sources_ = this._sourceHelpers,
        helpers = [],
        blocks = [],
        variables = [],
        line = 1,
        buffer = ''

    /**
     * @function sourceToJs 解析Source为JS字符串拼接
     * @param  {String} source HTML
     * @return {String}
     */
    var sourceToJs = function(source) {
      var helperName,
          match,
          str

      while(match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
        helperName = match[1]
        str = match[2]

        str = helperName && _sources_.hasOwnProperty(helperName)
          ? _sources_[helperName](str)
          : str

        str = '<%=unescape("' + escape(str) + '");%>'
        source = source.replace(match[0], str)
      }

      return source
    }

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
        source = '$buffer+=$helpers.$toString(' + source.replace(/[=\s;]/g, '') + ', ' + isEscape + ');'
      }
      // no escape HTML code
      else if (/^#\s*[\w\W]+?\s*$/.exec(source)) {
        source = '$buffer+=$helpers.$noescape(' + source.replace(/[#\s;]/g, '') + ');'
      }
      // escape HTML code
      else if (/^!#\s*[\w\W]+?\s*$/.exec(source)) {
        source = '$buffer+=$helpers.$escape(' + source.replace(/[!#\s;]/g, '') + ');'
      }
      // echo helper
      else if (/^\s*([\w\W]+)\s*\([^\)]*?\)\s*$/.exec(source)) {
        source = '$buffer+=$helpers.$toString(' + source + ', ' + isEscape + ');'
      }

      // save the running line
      line += source.split(/\n|%0A/).length - 1
      source += (/\)$/.exec(source) ? ';' : '') + '$runtime=' + line +  ';'
      return source
    }

    source = is('String')(source) ? sourceToJs(source) : ''

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
      +          'Shell: "' + escapeSymbol(this.$$table(origin)) + '"'
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
        self.$$throw({
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

          self.$$throw({
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
    if (is('String')(var_query)) {
      if ((var_query === 'openTag' && var_query === '<%') || (var_query === 'closeTag' && var_query === '%>')) {
        return this
      }

      this._defaults[var_query] = value
      return this
    }
  }

  var self = this
  if (is('PlainObject')(var_query)) {
    forEach(options, function(name, value) {
      self.config(name, value)
    })

    return this
  }

  if (is('String')(var_query)) {
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
    if (is('String')(var_query) && is('Function')(callback)) {
      this._helpers[var_query] = callback
    }
  }
  else {
    if (is('String')(var_query)) {
      return this._helpers[var_query]
    }

    if (is('PlainObject')(var_query)) {
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

  if (is('Function')(render)) {
    return render
  }

  render = this.$compile(source, conf)
  is('String')(filename) && this.$$cache(filename, render)
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
  data = is('PlainObject')(data) ? data : this._defaults
  return source.replace(/<%=\s*([^\s]+?)\s*%>/igm, function(all, $1) {
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
      syntax: is('RegExp')(var_syntax) ? var_syntax : this.$$compileRegexp('<%= openTag %>' + var_syntax + '<%= closeTag %>', 'igm'),
      shell: is('Function')(shell) ? shell : '<%' + this.$$compile(shell) + '%>'
    }
  }
  else if (is('PlainObject')(var_syntax)) {
    forEach(var_syntax, function(shell, syntax) {
      self.$registerSyntax(name, syntax, shell)
    })
  }
  else if (is('Array')(var_syntax)) {
    forEach(var_syntax, function(compiler) {
      is('String')(compiler.syntax)
      && is('String')(compiler.shell) || is('Function')(compiler.shell)
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
OTemplate.prototype.$analyzeSyntax = function(source, compile, origin) {
  origin = origin || ''
  compile = !(false === compile)

  var tpl = source
  if (compile) {
    forEach(this._blocks, function(handle) {
      tpl = tpl.replace(handle.syntax, '')
    })
  }

  // error open or close tag/语法错误，缺少闭合
  var tagReg = this.$$compileRegexp('<%= openTag %>|<%= closeTag %>', 'igm'),
      stripTpl = this.$clearSyntax(tpl)
      pos = stripTpl.search(tagReg)

  if (-1 !== pos) {
    var line = inline(stripTpl, pos)

    return {
      message: '[Syntax Error]: Syntax error in line ' + line + '.',
      syntax: this.$$table(origin)
    }
  }

  // not match any syntax or helper/语法错误，没有匹配到相关语法
  var syntaxReg = this.$$compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm'),
      match = source.match(syntaxReg)

  if (match) {
    var pos = tpl.search(syntaxReg),
        line = inline(tpl, pos)

    return {
      message: '[Syntax Error]: `' + match[0] + '` did not match any syntax in line ' + line + '.',
      syntax: this.$$table(tpl)
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

  var origin = source,
      conf = this._defaults,
      valid

  forEach(this._blocks, function(handle) {
    source = source.replace(handle.syntax, handle.shell)
  })

  // 检测一下是否存在未匹配语法
  return strict ? (true === (valid = this.$analyzeSyntax(source, false, origin)) ? source : (this.$$throw(valid) || '')) : this.$clearSyntax(source)
}

/**
 * @function block 查询/设置块级辅助函数
 * @param  {String|Object}  var_query 需要查找或设置的函数名|需要设置辅助函数集合
 * @param  {Function}       callback  回调函数
 * @return {OTemplate|Function}
 * @description
 *
 * 只有语法版本才拥有 block 这个概念，原生版本可以通过各种函数达到目的
 */
OTemplate.prototype.block = function(var_query, callback) {
  if (1 < arguments.length) {
    if (is('String')(var_query) && is('Function')(callback)) {
      this
        .$registerSyntax(var_query + 'open', '(' + var_query + ')\\s*(,?\\s*([\\w\\W]+?))\\s*(:\\s*([\\w\\W]+?))?\\s*', function($all, $1, $2, $3, $4, $5) {
          return '<%' + $1 + '($append, ' + ($2 ? $2 + ', ' : '') + 'function(' + ($5 || '') + ') {"use strict";var $buffer="";%>'
        })
        .$registerSyntax(var_query + 'close', '/' + var_query, 'return $buffer;});')
        ._blockHelpers[var_query] = function($append) {
          var args = Array.prototype.splice.call(arguments, 1)
          $append(callback.apply(this, args))
        }
    }
  }
  else {
    if (is('String')(var_query)) {
      return this._blockHelpers[var_query]
    }

    if (is('PlainObject')(var_query)) {
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
 * `noescpe`: {{# data}}
 * `escpe`:   {{!# data}}
 */
OTemplate.extend(function() {
  var HELPER_SYNTAX = '(!?#?)\\s*([^\\|]+?)\\s*\\|\\s*([^:]+?)\\s*(:\\s*([^\\|]+?))?\\s*(\\|\\s*[\\w\\W]+?)?',
      HELPER_REGEXP = this.$$compileRegexp(HELPER_SYNTAX),
      HELPER_INNER_SYNTAX = '\\s*([\\w\\W]+?\\s*\\\([\\w\\W]+?\\\))\\s*\\|\\s*([^:]+?)\\s*(:\\s*([^\\|]+?))?$',
      HELPER_INNER_REGEXP = this.$$compileRegexp(HELPER_INNER_SYNTAX)

  this
    .$registerSyntax('echo', '@\\s*([^|]+?)\\s*', '=$1')
    .$registerSyntax('ifopen', 'if\\s*(.+?)\\s*', 'if($1) {')
    .$registerSyntax('else', 'else', '} else {')
    .$registerSyntax('elseif', 'else\\s*if\\s*(.+?)\\s*', '} else if($1) {')
    .$registerSyntax('ifclose', '\\/if', '}')
    .$registerSyntax('eachopen', 'each\\s*([\\w\\W]+?)\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', function($all, $1, $2, $3, $4) {
        var str = 'each(' + $1 + ', function(' + ($3 || '$value') + ($4 || ', $index') + ') {'
        return '<%' + str + '%>'
      })
    .$registerSyntax('eachclose', '\\/each', '})')
    .$registerSyntax('include', 'include\\s*([\\w\\W]+?)\\s*(,\\s*[\\w\\W]+?)?\\s*', function($all, $1, $2) {
        return '<%#include(' + $1 + ($2 || ', $data') + ')%>'
      })
    .$registerSyntax('noescape', '#\\s*([^|]+?)\\s*', '#$1')
    .$registerSyntax('escape', '!#\\s*([^|]+?)\\s*', '!#$1')
    .$registerSyntax('helper', HELPER_SYNTAX, (function() {
        return function($all, $1, $2, $3, $4, $5, $6) {
          var str = format.apply(this, arguments)
          while (HELPER_INNER_REGEXP.exec(str)) {
            str = str.replace(HELPER_INNER_REGEXP, innerFormat)
          }

          return '<%' + toString($1) + str + '%>'
        }

        function format($all, $1, $2, $3, $4, $5, $6) {
          return $3 + '(' + trim($2) + ($5 ? ',' + $5 : '') + ')' + ($6 ? $6.replace(/^\s*$/, '') : '')
        }

        function innerFormat($all, $1, $2, $3, $4) {
          return $2 + '(' + $1 + ',' + $4 + ')'
        }
      })())

  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
});
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

  if (is('Function')(render)) {
    return render
  }

  var node = document.getElementById(id)
  return node
    ? this.compile(node.innerHTML, conf)
    : (this.$$throw({
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
  if (!is('Function')(callback)) {
    return
  }

  var self = this,
      conf = extend({}, this._defaults, options),
      render = true === conf.overwrite || this.$$cache(filename)

  is('Function')(render)
    ? callback(render)
    : this.readFile(filename, function(source) {
        source = self.$compileSyntax(source, !!conf.strict)

        var origin = source,
            requires = [],
            match

        while(match = /<%!?#?\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")(\s*,\s*([^\)]+)?)\)%>/.exec(source)) {
          requires.push(match[3])
          source = source.replace(match[0], '')
        }

        var total = requires.length
        var __exec = function() {
          0 >= (-- total) && __return()
        }

        var __return = function() {
          render = self.$compile(origin)
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
  if (is('Function')(data)) {
    return this.renderByAjax(filename, {}, data, callback)
  }

  is('Function')(callback) && this.compileByAjax(filename, function(render) {
    callback(render(data || {}))
  }, options)
}

/**
 * @function readFile 读取文件
 * @param  {String}   filename 文件名
 * @param  {Function} callback 回调函数
 */
OTemplate.prototype.readFile = function(filename, callback, errorCallback) {
  if (!is('Function')(callback)) {
    return
  }

  var self = this,
      xhr = new XMLHttpRequest()

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

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.ontimeout = function() {
    var err = {
      message: '[Request Template]: Request template file `' + filename + '` timeout.',
      filename: filename
    }

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
    errorCallback = undefined
  }

  xhr.onabort = function() {
    var err = {
      message: '[Request Template]: Bowswer absort the request.',
      filename: filename
    }

    self.$$throw(err)
    is('Function')(errorCallback) && errorCallback(err)
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
 * @function is 判断对象是否为 type 类型
 * @param  {String} type
 * @return {Function}
 *   @param {Anything} elem 要判断的对象
 */
function is(type) {
  // 是否未定义
  if ('Undefined' === type) {
    return function(o) {
      return 'undefined' === typeof o
    }
  }

  // 是否定义
  if ('Defined' === type) {
    return function(o) {
      return 'undefined' !== typeof o
    }
  }

  // 是否为一个整数
  if ('Integer' === type) {
    return function(o) {
      var y = parseInt(o, 10)
      return !isNaN(y) && o === y && o.toString() === y.toString()
    }
  }

  // 是否为一个纯对象
  if ('PlainObject' === type) {
    return function(o) {
      var ctor,
          prot

      if (false === is('Object')(o) || is('Undefined')(o)) {
          return false
      }

      ctor = o.constructor
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
    }
  }

  return function(o) {
    return '[object ' + type + ']' === Object.prototype.toString.call(o)
  }
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
  if (!is('String')(query)) {
    return undefined
  }

  var re = space,
      ns = query.split(token || '.'),
      i = 0,
      l = ns.length

  for (; i < l; i ++) {
    if (is('Undefined')(re[ns[i]])) {
        return undefined
    }

    re = re[ns[i]]
  }

  return is('Undefined')(re) ? undefined : re
}

/**
 * @function toString 强制转化成字符串
 * @param  {Anything} value 传入的值
 * @return {String}
 */
function toString(value) {
  if (is('String')(value)) {
    return value
  }

  if (is('Number')(value)) {
    return value += ''
  }

  if (is('Function')(value)) {
    return toString(value.call(value))
  }

  return ''
}

/**
 * @function escapeSymbol 转义标点符号
 * @param  {String} a 需要转义的字符串
 * @return {String}
 */
function escapeSymbol(a) {
  return a
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * @function escapeHTML 转义HTML字符
 * @param  {String} content HTML字符
 * @return {String}
 */
function escapeHTML(content) {
  return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeHTML.escapeFn)
}

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

/**
 * @function forEach 遍历数组或对象
 * @param {Array|Object}  a        数组或对象
 * @param {Function}      callback 回调函数
 */
function forEach(a, callback) {
  if (is('Function')(callback)) {
    var i
    if (is('Array')(a)) {
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
    else if (is('Object')(a)) {
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
  var isArr = is('Array')(collection),
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

  if (is('Array')(a) && is('Array')(b)) {
    Array.prototype.splice.apply(a, [a.length, 0].concat(b))
  }
  else if (is('PlainObject')(a) && is('PlainObject')(b)) {
    for (var i in b) {
      a[i] = b[i]
    }
  }

  return a
}

/**
 * @functioninArray 获取元素在数组中所在位置的键值
 * @param  {Anything} value 要获取键值的元素
 * @param  {Array}    array 数组
 * @return {Integer}        键值，不存在返回 -1;
 */
function inArray(value, array) {
  if (Array.prototype.indexOf && angular.isFunction(array.indexOf)) {
    return array.indexOf(value)
  }
  else {
    for (var i = 0; i < array.length; i ++) {
      if (array[i] === value) return i
    }

    return -1
  }
}

/**
 * @function inArrayBy inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @param  {Object|Integer} var_query 对象或数字(数字用于数组下标)
 * @return {Integer}                  键值，不存在返回 -1;
 */
function inArrayBy(var_query, array, index_name) {
  var index,
      i = 0,
      l = array.length

  index = angular.isObject(var_query)
    ? var_query[index_name]
    : index = var_query

  for (; i < l; i ++) {
    if (index == array[i][index_name]) {
      return i
    }
  }

  return -1
};

/**
 * @function __throw 抛出异常
 * @param  {String|Object} error  错误异常
 * @param  {Boolean}       type   是否捕获事件
 */
function __throw(error, type) {
  type = is('String')(type) ? type : 'log'

  var message = ''
  if (is('Object')(error)) {
    forEach(error, function(value, name) {
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

  function _throw(message) {
    setTimeout(function() {
      throw message
    })
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