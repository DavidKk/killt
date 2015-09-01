~(function(root) {'use strict';
/**
 * @class OTemplate 模板引擎
 * @param {Object} options 配置
 *   @param {String} openTag  起始标识
 *   @param {String} closeTag 结束标识
 */
var OTemplate = function(options) {
  options = options || {}

  this._caches = {}                   // render caches/编译器缓存
  this._blocks = {}                   // block syntax/块状语法
  this._helpers = {}                  // helpers/辅助函数
  this._defaults = {}                 // defualt config/默认配置

  // set the config/设置配置
  extend(this._defaults, OTemplate._defaults, options)

  // set any syntax/设置语法
  isFunction(OTemplate._extends) && this.extends(OTemplate._extends)
}

OTemplate._defaults = {             // 默认配置
  env: 'produce',                   // 当前环境 [unit, develop, produce]
  noSyntax: false,                  // is use origin js syntax/是否使用使用原生语法
  strict: true,                     // compile syntax in strict mode/是否通过严格模式编译语法
  compress: true,                   // compress the html code/压缩生成的HTML代码
  openTag: '{{',                    // 起始标识
  closeTag: '}}',                   // 结束标识
  cache: true,                      // cache the compiled template/是否缓存编译过的模板
  depends: []                       // add render arguments/添加渲染器的传值设定,默认拥有
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

  var helpers = this._helpers,
      methods = [],
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

  forEach(unique(methods), function(name) {
    buffer = 'var ' + name + '=$helpers.' + name + ';' + buffer
  })

  // use strict
  buffer = 'try {'
    +        '"use strict";'
    +        'var $scope=this,$helpers=$scope.$helpers,$buffer="",$runtime=0;'
    +        buffer
    +        'return $buffer;'
    +      '} catch(err) {'
    +         'throw {'
    +           'message: err.message,'
    +           'line: $runtime,'
    +           'shell: "' + escape(this.$$table(source)) + '"'
    +         '};'
    +       '}'

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
    analyzeVariables(source)

    if (/^\s*\w+\s*\([^\)]*?\)\s*$/.exec(source)) {
      source = '$buffer+=' + source + '||"";'
    }

    line += source.split(/\n/).length - 1
    source += '$runtime=' + line +  ';'
    return source
  }

  /**
   * @function analyzeVariables 给变量分类
   * @param  {String} source JS shell
   * @return {Array}
   */
  function analyzeVariables(source) {
    forEach(getVariables(source), function(name) {
      if (!name) {
        return
      }

      var func = root[name]
      if (isFunction(func) && func.toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
        return
      }

      if (isFunction(helpers[name])) {
        methods.push(name)
        return
      }

      variables.push(name)
    })

    return [methods, variables]
  }

  /**
   * @function getVariables 获取变量名
   * @param  {String} source Shell
   * @return {Array}
   */
  function getVariables(source) {
    var KEYWORDS = [
      '$data', '$helper', '$buffer', '$runtime',

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

    return source
      .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
      .replace(/[^\w$]+/g, ',')
      .replace(new RegExp('\\b' + KEYWORDS.join('\\b|\\b') + '\\b', 'g'), '')
      .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
      .split(/^$|,+/)
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
    $helpers: this._helpers
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

      render = function() {
        return ''
      }
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
 * @function $render 渲染模板
 * @param  {String} source  模板
 * @param  {Object} data    数据
 * @param  {Object} options 配置
 * @return {String}
 */
OTemplate.prototype.$render = function(source, data, options) {
  var render = this.$compile(source, options)
  return render(data)
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
    each(options, function(name, value) {
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
        .$registerSyntax(var_query + 'close', '/' + var_query, '})')
        ._helpers[var_query] = callback
    }
  }
  else {
    if (isString(var_query)) {
      return this._helpers[var_query]
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
  var blocks = this._blocks

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
 * @function compile 编译模板文件
 * @param  {String}   file     文件名
 * @param  {Function} callback 回调函数
 * @param  {Object}   options  配置
 */
OTemplate.prototype.compile = function(file, callback, options) {
  var conf = extend({}, this._defaults, options),
      render = this.$$cache(file)

  isFunction(render)
    ? callback(render)
    : readFile(file, function(source) {
        render = this.$compile(source)
        if (true === conf.cache) {
          this.$$cache(file, render)
        }

        callback(render)
      })
}

/**
 * @function render 渲染模板文件
 * @param  {String}   file     文件名
 * @param  {Object}   data     数据
 * @param  {Function} callback 回调函数
 * @param  {Object}   options  配置
 */
OTemplate.prototype.render = function(file, data, callback, options) {

}
;
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
 * @function make 制作对象
 * @param  {String}     query
 * @param  {Object}     space 需要制作的对象
 * @param  {Anything} value 需要赋的值
 * @param  {String}     token 分割 token
 * @return {Anything}
 * 
 * @example
 *     {a:{}}       -> $.make('a.a.a.a', 1) -> {a:{a:{a:{a:1}}}}
 *     {a:{a:1}}    -> $.make('a.a', 2)     -> {a:{a:2}}
 */
function make(query, space, value, token) {
  var i = 0,
      ns = query.split(token || '.'),
      l = ns.length,
      ori = space || {},
      re = ori;

  for (; i < l; i ++) {
      if (i == l -1) {
        re[ns[i]] = value;
      }
      else {
        if (!(re.hasOwnProperty(ns[i]) && isPlainObject(re[ns[i]]))) {
          re[ns[i]] = {}
        }

        re = re[ns[i]]
      }
  }

  return ori
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
}})(this);