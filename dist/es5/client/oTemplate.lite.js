~(function(root) {'use strict';
/**
 * OTemplate A Template engine for Javascript
 * @class
 * @param {Object}    options             配置
 * @param {string}    options.env         [unit, develop, produce]
 * @param {boolean}   options.noSyntax    是否使用使用原生语法
 * @param {boolean}   options.strict      是否通过严格模式编译语法
 * @param {boolean}   options.compress    压缩生成的HTML代码
 * @param {string}    options.openTag     语法的起始标识
 * @param {string}    options.closeTag    语法的结束标识
 * @param {array}     options.depends     追加渲染器的传值设定
 */
var OTemplate = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};
  /**
   * 构造函数
   * @function
   * @param {Object} options 配置 (optional)
   */
  function OTemplate() {var options = arguments[0];if(options === void 0)options = {};
    var self = this

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
     * @type {array}
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

        var conf = self.DEFAULTS
        return true === (is('Boolean')(isEscape) ? isEscape : conf.escape)
          ? self.helper('$escape')(string)
          : string
      },
      include: function(filename) {var data = arguments[1];if(data === void 0)data = {};var options = arguments[2];if(options === void 0)options = {};
        var conf = self.DEFAULTS,
            node = document.getElementById(filename)

        if (node) {
          self.$$throw({
            message: (("[Include Error]: Template ID " + filename) + " is not found.")
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
  }DP$0(OTemplate,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  /**
   * 抛出错误
   * @function
   * @param {string} message 错误信息
   * @param {Object} options 配置 (optional)
   */
  proto$0.$$throw = function(message) {var options = arguments[1];if(options === void 0)options = {};
    var conf = extend({}, this.DEFAULTS, options),
        err  = __throw(message, conf.env === OTemplate.ENV.UNIT ? 'null' : 'log')

    forEach(this._listeners, function(listener) {
      'error' === listener.type && listener.handle(err)
    })
  };

  /**
   * 获取或设置缓存方法
   * @function
   * @param {string} name 方法名称
   * @param {Function} render 渲染函数
   * @returns {Function|OTemplate}
   */
  proto$0.$$cache = function(name, render) {
    var caches = this._caches
    if (arguments.length > 1) {
      caches[name] = render
      return this
    }

    return caches[name]
  };

  /**
   * 添加监听事件
   * @function
   * @param {string} type 监听类型
   * @param {Function} handle 监听函数
   * @returns {OTemplate}
   */
  proto$0.on = function(type, handle) {
    if (is('String')(type) && is('Function')(handle)) {
      this._listeners.push({
        type: type,
        handle: handle
      })
    }

    return this
  };

  /**
   * 撤销监听事件
   * @function
   * @param {Function} handle 监听函数
   * @returns {OTemplate}
   */
  proto$0.off = function(handle) {
    if (is('Function')(handle)) {
      var index = inArrayBy(this._listeners, handle, 'handle')
      -1 !== index && this._listeners.splice(index, 1)
    }

    return this
  };

  /**
   * 添加错误事件监听
   * @function
   * @param {Function} handle 监听函数
   * @returns {OTempalte}
   */
  proto$0.onError = function(handle) {
    return this.on('error', handle)
  };

  /**
   * 生成一个新的 OTemplate 制作对象
   * @function
   * @param  {Object} options 配置
   * @returns {OTemplate} 新的 OTemplate
   */
  proto$0.OTemplate = function(options) {
    return new OTemplate(options)
  };

  /**
   * 扩展 OTemplate
   * @function
   * @param {Function} callback 回调
   * @returns {OTemplate}
   */
  proto$0.extends = function(callback) {
    callback.call(this, this)
    return this
  };

  /**
   * 查询与设置配置
   * @function
   * @param {string|Object} query 设置/获取的配置值名称
   * @param {*} value 需要配置的值 (optional)
   * @returns {OTemplate|*} 设置则返回 OTemplate,获取则返回相应的配置
   */
  proto$0.config = function(query, value) {
    if (1 < arguments.length) {
      if (is('String')(query)) {
        if ((query === 'openTag' && query === '<%') || (query === 'closeTag' && query === '%>')) {
          return this
        }

        this.DEFAULTS[query] = value
        return this
      }
    }

    var self = this
    if (is('PlainObject')(query)) {
      forEach(query, function(name, value) {
        self.config(name, value)
      })

      return this
    }

    if (is('String')(query)) {
      return this.DEFAULTS[query]
    }
  };

  /**
   * 查找/设置辅助函数
   * @function
   * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
   * @param {Function} callback 回调函数
   * @returns {OTemplate|Function}
   */
  proto$0.helper = function(query, callback) {
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
        for (var name in query) {
          this.helper(name, query[name])
        }
      }
    }

    return this
  };

  /**
   * 注销辅助函数
   * @function
   * @param {string} name 名称
   * @returns {OTemplate}
   */
  proto$0.unhelper = function(name) {
    var helpers = this._helpers
    if (helpers.hasOwnProperty(name)) {
      delete helpers[name]
    }

    return this
  };

  /**
   * 编译模板
   * @function
   * @param {string} source 模板
   * @param {Object} options 配置
   * @returns {Function}
   * @description
   * 当渲染器已经被缓存的情况下，options 除 overwrite 外的所有属性均不会
   * 对渲染器造成任何修改；当 overwrite 为 true 的时候，缓存将被刷新，此
   * 时才能真正修改渲染器的配置
   */
  proto$0.compile = function(source) {var options = arguments[1];if(options === void 0)options = {};
    source = toString(source)

    var conf     = extend({}, this.DEFAULTS, options),
        filename = conf.filename,
        render   = true === conf.overwrite || this.$$cache(filename)

    if (is('Function')(render)) {
      return render
    }

    render = this.$compile(source, conf)
    is('String')(filename) && this.$$cache(filename, render)
    return render
  };

  /**
   * 渲染模板
   * @function
   * @param {string} source 模板
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @returns {string}
   */
  proto$0.render = function(source) {var data = arguments[1];if(data === void 0)data = {};var options = arguments[2];if(options === void 0)options = {};
    return this.compile(source, options)(data)
  };
MIXIN$0(OTemplate.prototype,proto$0);proto$0=void 0;return OTemplate;})();

/**
 * current envirment - 配置环境
 * @type {Object}
 */
OTemplate.ENV = OTemplate.prototype.ENV = {
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
  depends   : []
}

/**
 * extens plugins - 扩展集合
 * @type {Array}
 */
OTemplate._extends = []

/**
 * 扩展库
 * @function
 * @param  {Function} _extends_ 扩展方法
 * @return {OTemplate}
 */
OTemplate.extend = function(_extends_) {
  is('Function')(_extends_) && OTemplate._extends.push(_extends_)
  return this
}

~extend(OTemplate.prototype, {
  /**
   * add the line number to the string - 给每行开头添加序列号
   * @function
   * @param  {string} str 需要添加序列号的字符串
   * @returns {string}
   */
  $$table: (function() {
    return function(string) {
      var line  = 0,
          match = string.match(/([^\n]*)?\n|([^\n]+)$/g)

      if (!match) {
        return line + ' | ' + string
      }

      var max = match.length
      return string.replace(/([^\n]*)?\n|([^\n]+)$/g, function($all) {
        return zeros(++ line, max) + ' | ' + $all
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
    function zeros (num, max) {var zero = arguments[2];if(zero === void 0)zero = ' ';
      num = num.toString()
      max = max.toString().replace(/\d/g, zero)

      var res = max.split('')
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
  $compileShell: (function() {
    /**
     * 获取变量名
     * @function
     * @param {string} source Shell
     * @returns {Array}
     */
    function getVariables (source) {
      var variables = source
            .replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '')
            .replace(/[^\w$]+/g, ',')
            .replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '')
            .split(/^$|,+/)

      return filter(variables, function(variable) {
        return -1 === getVariables.KEYWORDS.indexOf(variable)
      })
    }

    getVariables.KEYWORDS = [
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

    return function(source) {var options = arguments[1];if(options === void 0)options = {};
      var origin    = source,
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
      var sourceToJs = function(source) {
        var match
        while (match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
          var helperName = match[1]
          var str = match[2]

          str = helperName && _sources_.hasOwnProperty(helperName)
            ? _sources_[helperName](str)
            : str

          str = '<%=unescape("' + window.escape(str) + '");%>'
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
       * 解析脚本为JS字符串拼接
       * @function
       * @param {string} source JS shell
       * @returns {string}
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

        var p1 = (p2 = [code[0], code[1]])[0], p2 = p2[1]

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
        buffer = (("var " + name) + ("=$data." + name) + (";" + buffer) + "")
      })

      // define helpers
      forEach(unique(helpers), function(name) {
        buffer = (("var " + name) + ("=$helpers." + name) + (";" + buffer) + "")
      })

      // define block helpers
      forEach(unique(blocks), function(name) {
        buffer = (("var " + name) + ("=$blocks." + name) + (";" + buffer) + "")
      })

      // use strict
      buffer = (("\
\n        try {\
\n          'use strict';\
\n          var $scope=this,\
\n              $helpers=$scope.$helpers,\
\n              $blocks=$scope.$blocks,\
\n              $buffer='',\
\n              $runtime=0;\
\n          " + buffer) + (";\
\n          return $buffer;\
\n        }\
\n        catch (err) {\
\n          throw {\
\n            message : err.message,\
\n            line    : $runtime,\
\n            shell   : '" + (escapeSymbol(this.$$table(origin)))) + "'\
\n          };\
\n        }\
\n\
\n        function $append(buffer) {\
\n          $buffer+=buffer;\
\n        }")

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
   * must compile it again. And u can use options.overwrite
   * to overwrite it.
   * 
   * 渲染器的 options 将与渲染器一起缓存起来，且不会被
   * 外界影响，若要修改 options，则必须重新生成渲染器，
   * 可以设置 options.overwrite 为 true 来覆盖
   */
  $compile: (function() {
    return function() {var source = arguments[0];if(source === void 0)source = '';var options = arguments[1];if(options === void 0)options = {};
      var self    = this,
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

      var shell = this.$compileShell(source, conf)
      return buildRender({
        $source   : origin,
        $helpers  : this._helpers || {},
        $blocks   : this._blockHelpers || {}
      })

      function buildRender (scope) {
        var render

        try {
          render = new Function(_args_, shell)
        }
        catch(err) {
          self.$$throw({
            message   : ("[Compile Render]: " + (err.message)),
            line      : ("Javascript syntax occur error, it can not find out the error line."),
            syntax    : origin,
            template  : source,
            shell     : shell
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
              message   : ("[Exec Render]: " + (err.message)),
              line      : err.line,
              template  : err.source,
              shell     : err.shell
            })
          }
        }
      }
    }
  })(),
})
;
/**
 * 扩展新的 include 支持 ajax
 */
OTemplate.extend(function() {
  var self = this

  ~extend(this._helpers, {
    include: function(filename, data, options) {
      return self.renderById(filename, data, options)
    }
  })
})

~extend(OTemplate.prototype, {
  /**
   * 编译内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} options 配置 (optional)
   * @returns {Function} 编译函数
   */
  compileById: function(templateId) {var options = arguments[1];if(options === void 0)options = {};
    templateId = toString(templateId)

    var conf   = extend({}, this._defaults, options, { filename: templateId }),
        render = true === conf.overwrite || this.$$cache(templateId)

    if (is('Function')(render)) {
      return render
    }

    var node = document.getElementById(templateId)

    return node
      ? this.compile(node.innerHTML, conf)
      : (this.$$throw({
          message: ("[Compile Template]: Template ID {templateId} is not found.")
        }),
        __render)
  },

  /**
   * 渲染内联模板
   * @function
   * @param {string} templateId 模板ID
   * @param {Object} data 数据 (optional)
   * @param {Object} options 配置 (optional)
   * @returns {string} 内容
   */
  renderById: function(templateId) {var data = arguments[1];if(data === void 0)data = {};var options = arguments[2];if(options === void 0)options = {};
    var render = this.compileById(templateId, options = {})
    return render(data)
  },

  /**
   * 编译远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  compileByAjax: function(sourceUrl, callback) {var options = arguments[2];if(options === void 0)options = {};
    if (!is('Function')(callback)) {
      return
    }

    var self   = this,
        conf   = extend({}, this._defaults, options),
        render = true === conf.overwrite || this.$$cache(sourceUrl)

    if (is('Function')(render)) {
      callback(render)
    }
    else {
      this.getSourceByAjax(sourceUrl, function(source) {
        source = self.$compileSyntax(source, !!conf.strict)

        var origin = (match = [source, []])[0], requires = match[1], match = match[2]
        while (match = /<%!?#?\s*include\s*\(\s*(\'([^\']+)?\'|\"([^\"]+)?\")(\s*,\s*([^\)]+)?)?\)%>/.exec(source)) {
          requires.push(match[3])
          source = source.replace(match[0], '')
        }

        var total = requires.length
        var __exec = function() {
          0 >= (-- total) && __return()
        }

        var __return = function() {
          render = self.$compile(origin)
          self.$$cache(sourceUrl, render)
          callback(render)
          total = undefined
        }

        if (total > 0) {
          forEach(unique(requires), function(file) {
            if (self.$$cache(file)) {
              __exec()
            }
            else {
              var childSource = findChildTpl(file, origin)

              if (childSource) {
                self.compile(childSource, {
                  filename: file,
                  overwrite: false
                })

                __exec()
              }
              else {
                var node = document.getElementById(file)

                if (node) {
                  self.compile(node.innerHTML, {
                    filename: file,
                    overwrite: false
                  })

                  __exec()
                }
                else {
                  self.compileByAjax(file, __exec, extend(conf, {
                    overwrite: false
                  }))
                }
              }
            }
          })
        }
        else {
          __return()
        }
      })
    }

    function findChildTpl (templateId, source) {
      var node = document.createElement('div')
      node.innerHTML = source

      var templateNodes = node.getElementsByTagName('script')
      for (var i = templateNodes.length; i --;) {
        if (templateId === templateNodes[i].id) {
          return templateNodes[i].innerHTML
        }
      }
    }
  },

  /**
   * 渲染远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Object} data 数据 (optional)
   * @param {Function} callback 回调函数
   * @param {Object} options 配置 (optional)
   */
  renderByAjax: function(sourceUrl, data, callback) {var options = arguments[3];if(options === void 0)options = {};
    if (is('Function')(data)) {
      return this.renderByAjax(sourceUrl, {}, data, callback)
    }

    if (is('Function')(callback)) {
      this.compileByAjax(sourceUrl, function(render) {
        callback(render(data || {}))
      }, options)
    }
  },

  /**
   * 请求远程模板资源
   * @function
   * @param {string} sourceUrl 远程资源地址
   * @param {Function} callback 回调函数
   */
  getSourceByAjax: function(sourceUrl, callback, errorCallback) {
    if (!is('Function')(callback)) {
      return
    }

    var self = (xhr = [this, new XMLHttpRequest])[0], xhr = xhr[1]

    xhr.onreadystatechange = function() {
      var status = this.status
      if (this.DONE === this.readyState) {
        200 <= status && status < 400 && callback(this.responseText)
      }
    }

    xhr.onerror = function() {
      var err = {
        message   : (("[Compile Template]: Request file " + sourceUrl) + " some error occured."),
        filename  : sourceUrl,
        response  : ("[Reponse State]: " + (this.status))
      }

      self.$$throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.ontimeout = function() {
      var err = {
        message   : (("[Request Template]: Request template file " + sourceUrl) + " timeout."),
        filename  : sourceUrl
      }

      self.$$throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.onabort = function() {
      var err = {
        message   : ("[Request Template]: Bowswer absort the request."),
        filename  : sourceUrl
      }

      self.$$throw(err)
      is('Function')(errorCallback) && errorCallback(err)
      errorCallback = undefined
    }

    xhr.open('GET', sourceUrl, true)
    xhr.send(null)
  },
});
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
        var y = parseInt(value, 10)
        return !isNaN(y) && value === y && value.toString() === y.toString()

      case 'PlainObject':
        var ctor, prot
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
        return '[object ' + type + ']' === Object.prototype.toString.call(value)
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
function get (object, path) {var spliter = arguments[2];if(spliter === void 0)spliter = '.';
  if (!is('String')(path)) {
    return undefined
  }

  var re = (ns = [object, path.split(spliter)])[0], ns = ns[1]
  for (var i = (l = [0, ns.length])[0], l = l[1]; i < l; i ++) {
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
function escapeSymbol () {var string = arguments[0];if(string === void 0)string = '';
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
    for (var i = (l = [0, array.length])[0], l = l[1]; i < l; i ++) {
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
  var index = is('Object')(query)
    ? query[propName]
    : query

  for (var i = (l = [0, array.length])[0], l = l[1]; i < l; i ++) {
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
function forEach (collection) {var callback = arguments[1];if(callback === void 0)callback = new Function;
  if (is('Function')(callback)) {
    if (is('Array')(collection)) {
      if (Array.prototype.some) {
        collection.some(callback)
      }
      else {
        for (var i = (l = [0, collection.length])[0], l = l[1]; i < l; i ++) {
          if (true === callback(collection[i], i)) {
            break
          }
        }
      }
    }
    else if (is('Object')(collection)) {
      for (var i$0 in collection) {
        if (true === callback(collection[i$0], i$0)) {
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
  var n = (r = [{}, []])[0], r = r[1]

  for (var i = array.length; i --;) {
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
function filter (collection) {var callback = arguments[1];if(callback === void 0)callback = new Function;
  var isArr = is('Array')(collection),
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
function extend () {var SLICE$0 = Array.prototype.slice;var args = SLICE$0.call(arguments, 0);
  var paramA = (paramB = [args[0], args[1]])[0], paramB = paramB[1]

  if (args.length > 2) {
    paramA = extend(paramA, paramB)

    var next = Array.prototype.slice.call(args, 2)
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
      for (var i in paramB) {
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
  var message = ''

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

  function _throw (message) {
    setTimeout(function () {
      throw message
    })
  }
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
  var define = (module = [window.define, factory(root)])[0], module = module[1]

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