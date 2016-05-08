'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

~function (root) {
  if ('undefined' === typeof root) {
    var root;

    if ('undefined' !== typeof global) {
      root = global;
    } else if ('undefined' !== typeof window) {
      root = window;
    } else {
      root = {};
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
  function is(type) {
    return function (value) {
      switch (type) {
        case 'Undefined':
          return 'undefined' === typeof value;

        case 'Defined':
          return 'undefined' !== typeof value;

        case 'Integer':
          var y = parseInt(value, 10);
          return !isNaN(y) && value === y && value.toString() === y.toString();

        case 'PlainObject':
          var ctor = void 0,
              prot = void 0;
          if (false === is('Object')(value) || is('Undefined')(value)) {
            return false;
          }

          ctor = value.constructor;
          if ('function' !== typeof ctor) {
            return false;
          }

          prot = ctor.prototype;
          if (false === is('Object')(prot)) {
            return false;
          }

          if (false === prot.hasOwnProperty('isPrototypeOf')) {
            return false;
          }

          return true;

        default:
          return '[object ' + type + ']' === Object.prototype.toString.call(value);
      }
    };
  }

  /**
   * 获取所在行
   * @function
   * @param {string} string 需要查找的值
   * @param {number} position 编译
   * @returns {number}
   */
  function inline(string, position) {
    return (string.substr(0, position).match(/\n/g) || []).length + 1;
  }

  /**
   * 去除空格
   * @function
   * @param {string} string
   * @return {string}
   */
  function trim(string) {
    return toString(string).replace(/^\s+|\s+$/, '');
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
  function get(object, path) {
    var spliter = arguments.length <= 2 || arguments[2] === undefined ? '.' : arguments[2];

    if (!is('String')(path)) {
      return undefined;
    }

    var re = object;
    var ns = path.split(spliter);

    for (var i = 0, l = ns.length; i < l; i++) {
      if (is('Undefined')(re[ns[i]])) {
        return undefined;
      }

      re = re[ns[i]];
    }

    return is('Undefined')(re) ? undefined : re;
  }

  /**
   * 强制转化成字符串
   * @function
   * @param {*} anything 传入的值
   * @returns {string}
   */
  function toString(anything) {
    if (is('String')(anything)) {
      return anything;
    }

    if (is('Number')(anything)) {
      return anything += '';
    }

    if (is('Function')(anything)) {
      return toString(anything.call(anything));
    }

    return '';
  }

  /**
   * 转义标点符号
   * @function
   * @param {string} string 需要转义的字符串
   * @returns {string}
   */
  function escapeSymbol() {
    var string = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    return string.replace(/("|'|\\)/g, '\\$1').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  }

  /**
   * 转义HTML字符
   * @function
   * @param {string} string HTML字符
   * @returns {string}
   */
  function escapeHTML(string) {
    return toString(string).replace(/&(?![\w#]+;)|[<>"']/g, function (name) {
      return escapeHTML.SOURCES[name];
    });
  }

  // escape sources
  // 转义资源
  escapeHTML.SOURCES = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2f;'
  };

  /**
   * 获取元素在数组中所在位置的键值
   * @function
   * @param {array} array 数组
   * @param {*} value 要获取键值的元素
   * @returns {integer} 键值，不存在返回 -1;
   */
  function indexOf(array, value) {
    if (Array.prototype.indexOf && is('Function')(array.indexOf)) {
      return array.indexOf(value);
    } else {
      for (function () {
        var i = 0;
        var l = array.length;
      }(); i < l; i++) {
        if (array[i] === value) {
          return i;
        }
      }

      return -1;
    }
  }

  /**
   * inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
   * @function
   * @param {Object|integer} query 对象或数字(数字用于数组下标)
   * @return {Integer}                  键值，不存在返回 -1;
   */
  function inArrayBy(array, query, propName) {
    var index = is('Object')(query) ? query[propName] : query;

    for (function () {
      var i = 0;
      var l = array.length;
    }(); i < l; i++) {
      if (index == array[i][propName]) {
        return i;
      }
    }

    return -1;
  }

  /**
   * 遍历数组或对象
   * @function
   * @param {Array|Object} collection 需要遍历的结合
   * @param {Function} callback 回调函数
   */
  function forEach(collection) {
    var callback = arguments.length <= 1 || arguments[1] === undefined ? new Function() : arguments[1];

    if (is('Function')(callback)) {
      if (is('Array')(collection)) {
        if (Array.prototype.some) {
          collection.some(callback);
        } else {
          for (function () {
            var i = 0;
            var l = collection.length;
          }(); i < l; i++) {
            if (true === callback(collection[i], i)) {
              break;
            }
          }
        }
      } else if (is('Object')(collection)) {
        for (var _i in collection) {
          if (true === callback(collection[_i], _i)) {
            break;
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
  function unique(array) {
    var n = {};
    var r = [];


    for (var i = array.length; i--;) {
      if (!n.hasOwnProperty(array[i])) {
        r.push(array[i]);
        n[array[i]] = 1;
      }
    }

    return r;
  }

  /**
   * 集合过滤
   * @function
   * @param {Object|Array} collection 需要过滤的元素
   * @param {Function} callback 回调函数
   * @returns {Object|Array}
   */
  function filter(collection) {
    var callback = arguments.length <= 1 || arguments[1] === undefined ? new Function() : arguments[1];

    var isArr = is('Array')(collection),
        res = isArr ? [] : {};

    forEach(collection, function (val, key) {
      if (callback(val, key)) {
        res[isArr ? res.length : key] = val;
      }
    });

    return res;
  }

  /**
   * 合并数组或对象
   * @function
   * @param {Array|Object} objectA 对象
   * @param {Array|Object} objectB 对象
   * @param {Array|Object} ... 对象
   * @returns {Array|Object} objectA 第一个传入的对象
   */
  function extend() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var paramA = args[0];
    var paramB = args[1];


    if (args.length > 2) {
      paramA = extend(paramA, paramB);

      var next = Array.prototype.slice.call(args, 2);
      return extend.apply({}, [paramA].concat(next));
    }

    if (is('Array')(paramA) && is('Array')(paramB)) {
      Array.prototype.splice.apply(paramA, [paramA.length, 0].concat(paramB));
    } else if (is('Object')(paramA) && is('Object')(paramB)) {
      if (is('Function')(Object.assign)) {
        paramA = Object.assign(paramA, paramB);
      } else {
        for (var i in paramB) {
          paramA[i] = paramB[i];
        }
      }
    }

    return paramA;
  }

  /**
   * 抛出异常
   * @function
   * @param {string|Object} error 错误异常
   */
  function __throw(error) {
    var messages = [];

    if (is('Object')(error)) {
      forEach(error, function (value, name) {
        messages.push('<' + name.substr(0, 1).toUpperCase() + name.substr(1) + '>');
        messages.push('\n');
        messages.push(value);
        messages.push('\n\n');
      });
    } else if (is('String')(error)) {
      messages = error;
    }

    try {
      console.error.apply(console, messages);
    } catch (err) {
      setTimeout(function () {
        throw messages;
      });
    }

    return messages;
  }

  /**
   * 伪渲染函数
   * @function
   * @return {string} 空字符串
   */
  function __render() {
    return '';
  };

  /**
   * current envirment - 配置环境
   * @type {Object}
   */
  var ENV = {
    /** production env - 生产环境 */
    PRODUCE: 1,
    /** develop env - 开发环境 */
    DEVELOP: 2,
    /** unit test env - 单元测试环境 */
    UNITEST: 3
  };

  /**
   * default options - 默认配置
   * @type {Object}
   */
  var DEFAULTS = {
    /** current entironment - 当前环境 [unit, develop, produce] */
    env: ENV.PRODUCE,
    /** is use native syntax - 是否使用使用原生语法 */
    noSyntax: true,
    /** compile syntax in strict mode - 是否通过严格模式编译语法 */
    strict: true,
    /** escape the HTML - 是否编码输出变量的 HTML 字符 */
    escape: true,
    /** compress the html code - 压缩生成的HTML代码 */
    compress: true,
    /** addition render arguments (must be use `$` to define variable name) - 追加渲染器的传值设定,默认拥有 $data (必须使用 `$` 作为起始字符来定义变量) */
    depends: []
  };
  /**
   * extensions - 扩展集合
   * @type {Array}
   */
  var extensions = [];

  var KEYWORDS = ['$append', '$blocks', '$buffer', '$data', '$helpers', '$scope', '$runtime', 'abstract', 'arguments', 'break', 'boolean', 'byte', 'case', 'catch', 'char', 'class', 'continue', 'console', 'const', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'volatile', 'while', 'with', 'yield'];

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

  var Engine = function () {

    /**
     * 构造函数
     * @function
     * @param {Object} options 配置 (optional)
     */


    /**
     * event listener - 事件监听方法
     * @type {Array}
     */


    /**
     * source helpers - 资源辅助函数
     * @type {Object}
     */


    /**
     * block syntax - 块状语法
     * @type {Object}
     */

    function Engine() {
      var _this = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Engine);

      this._caches = {};
      this._blocks = {};
      this._blockHelpers = {};
      this._sourceHelpers = {};
      this._helpers = {
        $escape: function $escape() {
          return escapeHTML.apply(escapeHTML, arguments);
        },
        $noescape: function $noescape(string) {
          return toString(string);
        },
        $toString: function $toString(string, isEscape) {
          string = toString(string);

          return isEscape ? this.$escape(string) : string;
        }
      };
      this._listeners = [];
      this.setting = extend({}, DEFAULTS);

      // set the config - 设置配置
      this.setting = extend(this.setting, options);

      // set any extensions - 设置扩展
      if (is('Array')(extensions) && extensions.length > 0) {
        forEach(extensions, function (extension) {
          _this.extends(extension);
        });
      }
    }

    /**
     * 获取当前配置
     * @param  {Object} options 配置
     * @return {Object}         整合后的配置
     */


    /**
     * defualt config - 默认配置
     * @type {Object}
     */


    /**
     * helpers - 辅助函数
     * @type {Object}
     */


    /**
     * block helpers - 块状辅助函数
     * @type {Object}
     */

    /**
     * render caches - 编译器缓存
     * @type {Object}
     */


    _createClass(Engine, [{
      key: 'options',
      value: function options() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        return extend.apply({}, [{}, this.setting].concat(args));
      }

      /**
       * 查询与设置配置
       * @function
       * @param {string|Object} query 设置/获取的配置值名称
       * @param {*} value 需要配置的值 (optional)
       * @returns {Engine|*} 设置则返回 Engine,获取则返回相应的配置
       */

    }, {
      key: 'config',
      value: function config(query, value) {
        var _this2 = this;

        if (1 < arguments.length) {
          if (is('String')(query)) {
            if (query === 'openTag' && query === '<%' || query === 'closeTag' && query === '%>') {
              return this;
            }

            this.setting[query] = value;
            return this;
          }
        }

        if (is('PlainObject')(query)) {
          forEach(query, function (name, value) {
            _this2.config(name, value);
          });

          return this;
        }

        if (is('String')(query)) {
          return this.setting[query];
        }
      }

      /**
       * 编译脚本
       * @function
       * @param {string} source 脚本模板
       * @param {Object} options 配置
       * @returns {string}
       */

    }, {
      key: '$compileShell',
      value: function $compileShell() {
        var source = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var origin = source;
        var conf = this.options(options);
        var isEscape = !!conf.escape;
        var strip = !!conf.compress;
        var _helpers_ = this._helpers;
        var _blocks_ = this._blockHelpers;
        var _sources_ = this._sourceHelpers;
        var helpers = [];
        var blocks = [];
        var variables = [];
        var line = 1;
        var buffer = '';

        /**
         * 获取变量名
         * @function
         * @param {string} source Shell
         * @returns {Array}
         */
        var getVariables = function getVariables(source) {
          var variables = source.replace(/\\?\"([^\"])*\\?\"|\\?\'([^\'])*\\?\'|\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|\s*\.\s*[$\w\.]+/g, '').replace(/[^\w$]+/g, ',').replace(/^\d[^,]*|,\d[^,]*|^,+|,+$/g, '').split(/^$|,+/);

          return filter(variables, function (variable) {
            return -1 === KEYWORDS.indexOf(variable);
          });
        };

        /**
         * 解析Source为JS字符串拼接
         * @function
         * @param {string} source HTML
         * @returns {string}
         */
        var sourceToJs = function sourceToJs(source) {
          var match = void 0;

          while (match = /<%source\\s*([\w\W]+?)?\\s*%>(.+?)<%\/source%>/igm.exec(source)) {
            var helperName = match[1];
            var str = match[2];

            if (helperName && _sources_.hasOwnProperty(helperName)) {
              str = _sources_[helperName](str);
            }

            str = '<%=unescape(\'' + root.escape(str) + '\')%>';
            source = source.replace(match[0], str);
          }

          return source;
        };

        /**
         * 解析HTML为JS字符串拼接
         * @function
         * @param {string} source HTML
         * @returns {string}
         */
        var htmlToJs = function htmlToJs(source) {
          if ('' === source.replace(/<!--[\w\W]*?-->/g, '').replace(/^ +$/, '')) {
            return '$buffer+=\'' + source + '\';';
          }

          // Storage running line
          line += source.split(/\n/).length - 1;

          // encode
          source = source.replace(/(["'\\])/g, '\\$1');

          // check compress or not
          if (true === strip) {
            source = source.replace(/<!--[\w\W]*?-->/g, '').replace(/[\r\t\n]/g, '').replace(/ +/g, ' ');
          } else {
            source = source.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
          }

          // concat every block
          return '$buffer+=\'' + source + '\';';
        };

        /**
         * 解析脚本为JS字符串拼接
         * @function
         * @param {string} source JS shell
         * @returns {string}
         */
        var shellToJs = function shellToJs(source) {
          source = trim(source || '');

          // analyze and define variables
          forEach(getVariables(source), function (name) {
            if (!name) {
              return;
            }

            var func = root[name];
            if (is('Function')(func) && func.toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
              return;
            }

            if (is('Function')(_helpers_[name])) {
              helpers.push(name);
              return;
            }

            if (is('Function')(_blocks_[name])) {
              blocks.push(name);
              return;
            }

            variables.push(name);
          });

          // echo
          if (/^=\s*[\w\W]+?\s*$/.exec(source)) {
            source = '$buffer+=$helpers.$toString(' + source.replace(/^=|;$/g, '') + ', !!' + isEscape + ');';
          }
          // no escape HTML code
          else if (/^#\s*[\w\W]+?\s*$/.exec(source)) {
              source = '$buffer+=$helpers.$noescape(' + source.replace(/^#|;$/g, '') + ');';
            }
            // escape HTML code
            else if (/^!#\s*[\w\W]+?\s*$/.exec(source)) {
                source = '$buffer+=$helpers.$escape(' + source.replace(/^!#|;$/g, '') + ');';
              }
              // echo helper
              else if (/^\s*([\w\W]+)\s*\([^\)]*?\)\s*$/.exec(source)) {
                  source = '$buffer+=$helpers.$toString(' + source + ', !!' + isEscape + ');';
                }
                // nothing to match
                else {
                    source += ';';
                  }

          // Save the running line
          line += source.split(/\n|%0A/).length - 1;

          // Must be save the line at first, otherwise the error will break the execution.
          source = '$runtime=' + line + ';' + source + (/\)$/.exec(source) ? ';' : '');
          return source;
        };

        source = sourceToJs(source);

        // split logic and html
        forEach(source.split('<%'), function (code) {
          code = code.split('%>');

          var p1 = code[0];
          var p2 = code[1];


          if (1 === code.length) {
            buffer += htmlToJs(p1);
          } else {
            buffer += shellToJs(p1);
            buffer += htmlToJs(p2);
          }
        });

        // define variables
        forEach(unique(variables), function (name) {
          buffer = 'var ' + name + '=$data.' + name + ';' + buffer;
        });

        // define helpers
        forEach(unique(helpers), function (name) {
          buffer = 'var ' + name + '=$helpers.' + name + ';' + buffer;
        });

        // define block helpers
        forEach(unique(blocks), function (name) {
          buffer = 'var ' + name + '=$blocks.' + name + ';' + buffer;
        });

        // use strict
        buffer = 'try {' + '"use strict";' + 'var $scope=this,' + '$helpers=$scope.$helpers,' + '$blocks=$scope.$blocks,' + '$buffer="",' + '$runtime=0;' + buffer + 'return $buffer;' + '}' + 'catch(err) {' + 'throw {' + 'message: err.message,' + 'line: $runtime,' + ('shell: \'' + escapeSymbol(origin) + '\',') + 'args: arguments' + '};' + '}' + 'function $append(buffer) {' + '$buffer += buffer;' + '}';

        return buffer;
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

    }, {
      key: '$compile',
      value: function $compile() {
        var _this3 = this;

        var source = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var origin = source;
        var conf = this.options(options);
        var strip = !!conf.compress;
        var deps = conf.depends;
        var _args_ = ['$data'].concat(deps);
        var args = [];

        var buildRender = function buildRender(scope) {
          var render = void 0;

          var __catch = function __catch(err) {
            var _err = {
              message: '[Exec Render]: ' + err.message,
              template: options.filename,
              line: err.line,
              source: _this3._table(scope.$source, err.line),
              shell: _this3._table(err.shell, err.line)
            };

            forEach(_args_, function (name, key) {
              _err['arguments:' + name] = err.args[key];
            });

            _this3._throw(_err);
            return '';
          };

          try {
            render = new Function(_args_.join(','), shell);
          } catch (err) {
            _this3._throw({
              message: '[Compile Render]: ' + err.message,
              template: options.filename,
              line: 'Javascript syntax occur error, it can not find out the error line.',
              syntax: _this3._table(origin),
              source: source,
              shell: shell
            });

            render = __render;
          }

          if (false === strip) {
            return function (data) {
              try {
                var _source = render.apply(scope, [data].concat(args));
                return _source.replace(/<!--([\w\W]+?)-->/g, function ($all, $1) {
                  return '<!--' + root.unescape($1) + '-->';
                });
              } catch (err) {
                return __catch(err);
              }
            };
          } else {
            return function (data) {
              try {
                return render.apply(scope, [data].concat(args));
              } catch (err) {
                return __catch(err);
              }
            };
          }
        };

        // 获取需求的参数，除 data 之外
        ~forEach(deps, function (name) {
          if ('$' === name.charAt(0)) {
            name = name.replace('$', '');
            args.push(conf[name]);
          } else {
            args.push(undefined);
          }
        });

        if (false === strip) {
          source = source.replace(/<!--([\w\W]+?)-->/g, function ($all, $1) {
            return '<!--' + root.escape($1) + '-->';
          });
        }

        if (true !== conf.noSyntax) {
          source = this.$compileSyntax(source, !!conf.strict);
        }

        var shell = this.$compileShell(source, conf);

        return buildRender({
          $source: origin,
          $helpers: this._helpers || {},
          $blocks: this._blockHelpers || {}
        });
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

    }, {
      key: 'compile',
      value: function compile(source) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        source = toString(source);

        var conf = this.options(options);
        var filename = conf.filename;
        var render = true === conf.override || this._cache(filename);

        if (is('Function')(render)) {
          return render;
        }

        render = this.$compile(source, conf);
        is('String')(filename) && this._cache(filename, render);
        return render;
      }

      /**
       * 渲染模板
       * @function
       * @param {string} source 模板
       * @param {Object} data 数据 (optional)
       * @param {Object} options 配置 (optional)
       * @returns {string}
       */

    }, {
      key: 'render',
      value: function render(source) {
        var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        return Engine.prototype.compile.call(this, source, options)(data);
      }

      /**
       * 查找/设置辅助函数
       * @function
       * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
       * @param {Function} callback 回调函数
       * @returns {Engine|Function}
       */

    }, {
      key: 'helper',
      value: function helper(query, callback) {
        if (1 < arguments.length) {
          if (is('String')(query) && is('Function')(callback)) {
            this._helpers[query] = callback;
          }
        } else {
          if (is('String')(query)) {
            return this._helpers[query];
          }

          if (is('PlainObject')(query)) {
            for (var name in query) {
              this.helper(name, query[name]);
            }
          }
        }

        return this;
      }

      /**
       * 注销辅助函数
       * @function
       * @param {string} name 名称
       * @returns {Engine}
       */

    }, {
      key: 'unhelper',
      value: function unhelper(name) {
        var helpers = this._helpers;
        if (helpers.hasOwnProperty(name)) {
          delete helpers[name];
        }

        return this;
      }

      /**
       * 添加监听事件
       * @function
       * @param {string} type 监听类型
       * @param {Function} handle 监听函数
       * @returns {Engine}
       */

    }, {
      key: 'on',
      value: function on(type, handle) {
        if (is('String')(type) && is('Function')(handle)) {
          this._listeners.push({
            type: type,
            handle: handle
          });
        }

        return this;
      }

      /**
       * 撤销监听事件
       * @function
       * @param {Function} handle 监听函数
       * @returns {Engine}
       */

    }, {
      key: 'off',
      value: function off(handle) {
        if (is('Function')(handle)) {
          var index = inArrayBy(this._listeners, handle, 'handle');-1 !== index && this._listeners.splice(index, 1);
        }

        return this;
      }

      /**
       * 添加错误事件监听
       * @function
       * @param {Function} handle 监听函数
       * @returns {OTempalte}
       */

    }, {
      key: 'onError',
      value: function onError(handle) {
        return this.on('error', handle);
      }

      /**
       * 扩展 Engine
       * @function
       * @param {Function} callback 回调
       * @returns {Engine}
       */

    }, {
      key: 'extends',
      value: function _extends(callback) {
        callback.call(this, this);
        return this;
      }

      /**
       * 抛出错误
       * @private
       * @function
       * @param {Object} error 错误信息
       * @param {Object} options 配置 (optional)
       */

    }, {
      key: '_throw',
      value: function _throw(error) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var conf = this.options(options);
        var message = ENV.UNITEST === conf.env && __throw(error);

        forEach(this._listeners, function (listener) {
          'error' === listener.type && listener.handle(error, message);
        });
      }

      /**
       * 获取或设置缓存方法
       * @private
       * @function
       * @param {string} name 方法名称
       * @param {Function} render 渲染函数
       * @returns {Function|Engine}
       */

    }, {
      key: '_cache',
      value: function _cache(name, render) {
        var caches = this._caches;
        if (arguments.length > 1) {
          caches[name] = render;
          return this;
        }

        return caches[name];
      }

      /**
       * add the line number to the string - 给每行开头添加序列号
       * @private
       * @function
       * @param  {string} str 需要添加序列号的字符串
       * @returns {string}
       */

    }, {
      key: '_table',
      value: function _table(string, direction) {
        var line = 0;
        var match = string.match(/([^\n]*)?\n|([^\n]+)$/g);

        if (!match) {
          return '> ' + line + '|' + string;
        }

        var max = match.length;
        var start = 0;
        var end = max;


        if (0 < direction && direction < max) {
          start = direction - 3;
          end = direction + 3;
        }

        return string.replace(/([^\n]*)?\n|([^\n]+)$/g, function ($all) {
          ++line;

          if (start <= line && line <= end) {
            if (line === direction) {
              return '> ' + zeros(line, max) + '|' + $all;
            }

            return '  ' + zeros(line, max) + '|' + $all;
          }

          return '';
        });

        /**
         * Zeros - 补零
         * @function
         * @param {integer} num 需要补零的数字
         * @param {integer} max 补零参考数字易为最大补零数字
         * @param {string} zero 需要填补的 "零"
         * @returns {string}
         */
        function zeros(num, max) {
          var zero = arguments.length <= 2 || arguments[2] === undefined ? ' ' : arguments[2];

          num = num.toString();
          max = max.toString().replace(/\d/g, zero);

          var res = max.split('');
          res.splice(-num.length, num.length, num);
          return res.join('');
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
       * @return {Engine}
       */

    }, {
      key: '$divide',
      value: function $divide(options) {
        return new this.constructor(options);
      }

      /**
       * current envirment - 配置环境
       * @type {Object}
       */

    }, {
      key: '$compileSyntax',


      /**
       * 编译语法
       * @function
       */
      value: function $compileSyntax() {
        throw new Error('Function `$compileSyntax` does not be implemented.');
      }
    }, {
      key: 'ENV',
      get: function get() {
        return ENV;
      }

      /**
       * 扩展库
       * @function
       * @param  {Function} _extends_ 扩展方法
       * @return {Engine}
       */

    }], [{
      key: 'extend',
      value: function extend(extension) {
        is('Function')(extension) && extensions.push(extension);
        return this;
      }
    }]);

    return Engine;
  }();

  ;
  extend(DEFAULTS, {
    /** open tag for syntax - 起始标识 */
    openTag: '{{',
    /** close tag for syntax - 结束标识 */
    closeTag: '}}',
    /** close no syntax config - 关闭没有语法的配置项 */
    noSyntax: false
  });

  /**
   * Syntax - 语法类
   * @class
   * @description
   * 该模块主要提供一系列方法和基础语法供使用者更为简洁编写模板和自定义扩展语法
   * 你可以通过 `$registerSyntax` 方法来扩展自己所需求的语法；
   * 同时，现有的默认语法均可以通过 `$unregisterSyntax` 方法进行删除或清空，
   * 使用者可以拥有完全自主的控制权，但是语法最终必须替换成原生语法 (以 `<%` 和 `%>` 为包裹标记)
   * 其包裹内容是 Javascript 代码，你可以通过 `block` `helper` 为模板渲染时创建
   * 需要的辅助函数。
   *
   * 自定义语法需注意：
   * 1. 正则表达式之间注意优先次序
   * 2. 注意贪婪模式与非贪婪模式的选择
   */

  var Syntax = function (_Engine) {
    _inherits(Syntax, _Engine);

    function Syntax() {
      _classCallCheck(this, Syntax);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(Syntax).apply(this, arguments));
    }

    _createClass(Syntax, [{
      key: '_compile',

      /**
       * 通过配置作为数据来替换模板
       * @function
       * @param {string} source 模板
       * @param {Object} data 数据 (optional)，若数据不为 object 则设为默认配置数据
       * @returns {string}
       * @description
       *
       * '<%= openTag %>hi<%= closeTag %>'
       * if my defauts is { openTag: '{{', closeTag: '}}' }
       * the result is '{{hi}}'
       */
      value: function _compile(source, data) {
        data = is('PlainObject')(data) ? data : this.setting;

        return source.replace(/<%=\s*([^\s]+?)\s*%>/igm, function (all, $1) {
          return get(data, $1) || '';
        });
      }

      /**
       * 通过配置作为数据和模板生成 RegExp
       * @function
       * @param {string} patternTemplate regexp 模板
       * @param {menu} attributes {igm}
       * @returns {regexp}
       * @description
       * '<%= openTag %>hi<%= closeTag %>'
       * if my defauts is { openTag: '{{', closeTag: '}}' }
       * replace string to '{{hi}}'
       * the return result is /{{hi}}/
       */

    }, {
      key: '_compileRegexp',
      value: function _compileRegexp(patternTemplate, attributes) {
        var pattern = this._compile(patternTemplate);
        return new RegExp(pattern, attributes);
      }

      /**
       * 编译语法模板
       * @function
       * @param {string} source 语法模板
       * @param {boolean} strict 是否为严格模式
       * @param {string} origin 原有的模板
       * @return {string}
       */

    }, {
      key: '_compileSyntax',
      value: function _compileSyntax(source) {
        var strict = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
        var origin = arguments.length <= 2 || arguments[2] === undefined ? source : arguments[2];

        var matched = false;

        forEach(this._blocks, function (handle) {
          var dress = source.replace(handle.syntax, handle.shell);

          if (dress !== source) {
            source = dress;
            matched = true;
            return true;
          }
        });

        // not match any syntax or helper
        // 语法错误，没有匹配到相关语法
        if (false === matched) {
          var pos = origin.search(source);
          var line = inline(origin, pos);

          this._throw({
            message: '[Syntax Error]: ' + source + ' did not match any syntax in line ' + line + '.',
            syntax: this._table(origin, line)
          });

          return true === strict ? false : '';
        }

        return source;
      }

      /**
       * 编译所有语法模板
       * @function
       * @param  {string}   source  语法模板
       * @param  {boolean}  strict  是否为严格模式,
       *                            若不为 false 编译时会验证语法正确性若不正确则返回空字符串;
       *                            若为 false 模式则会去除所有没有匹配到的语法,
       *                            默认为 true，除 false 之外所有均看成 true
       * @return {string}
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

    }, {
      key: '$compileSyntax',
      value: function $compileSyntax(source) {
        var _this5 = this;

        var strict = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        var origin = source;
        var conf = this.options();
        var blocks = this._blocks;
        var valid = void 0;

        source = escapeTags(source);

        /**
         * 分割标签，这样可以将所有正则都匹配每一个标签而不是整个字符串。
         * 若匹配整个字符串容易出现多余匹配问题。
         *
         * split tags, because regexp may match all the string.
         * it can make every regexp match each string between tags(openTag & closeTag)
         */
        forEach(source.split(conf.openTag), function (code) {
          var codes = code.split(conf.closeTag);

          // logic code block
          // 逻辑代码块
          if (1 !== codes.length) {
            source = source.replace('' + conf.openTag + codes[0] + conf.closeTag, function ($all) {
              return valid = _this5._compileSyntax($all, strict, origin);
            });
          }

          // exit, error on static mode
          // 严格状态下错误直接退出
          if (false === valid) {
            source = '';
            return true;
          }
        });

        // exit and return empty string
        // 退出并返回空字符串
        if ('' === source) {
          return '';
        }

        // error open or close tag
        // 语法错误，缺少闭合
        var tagReg = this._compileRegexp('<%= openTag %>|<%= closeTag %>', 'igm');
        var pos = source.search(tagReg);

        if (-1 !== pos) {
          // return empty string in static mode
          // 严格模式下错误直接返回空字符串
          if (true === strict) {
            var line = inline(source, pos);

            this._throw({
              message: '[Syntax Error]: Syntax error in line ' + line + '.',
              syntax: this._table(origin, line)
            });

            return '';
          }

          // not in static mode, clear nomatched syntax
          // 清除没有匹配的语法
          return this.$clearSyntax(source);
        }

        return source;

        /**
         * 转义原生的语法标签
         * @param {string} source 模板
         * @return {string}
         */
        function escapeTags(source) {
          return source.replace(/<%/g, '&lt;%').replace(/%>/g, '%&gt;');
        }
      }

      /**
       * 清除所有语法
       * @function
       * @param {string} source 语法模板
       * @returns {string}
       */

    }, {
      key: '$clearSyntax',
      value: function $clearSyntax(source) {
        var regexp = this._compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm');
        return source.replace(regexp, '');
      }

      /**
       * 注册语法
       * @function
       * @param {string} name 语法名称
       * @param {string|array|object|regexp} syntax 语法正则 (请注意贪婪与贪婪模式)，当为 RegExp时，记得用 openTag 和 closeTag 包裹
       * @param {string|function} shell 元脚本, 当为 Function 时记得加上 `<%` 和 `%>` 包裹
       * @returns {Syntax}
       * @description
       * '(\\\w+)' will be compiled to /{{(\\\w+)}}/igm
       * but please use the non-greedy regex, and modify it to'(\\\w+)?'
       * eg. when it wants to match '{{aaa}}{{aaa}}', it will match whole string
       * not '{{aaa}}'
       *
       * '(\\\w+)' 将会编译成 /{{\\\w+}}/igm
       * 但是这个正则是贪婪匹配，这样会造成很多匹配错误，我们必须将其改成 '(\\\w+)?'
       * 例如匹配 '{{aaa}}{{aaa}}' 的是否，贪婪匹配会将整个字符串匹配完成，而不是 '{{aaa}}'
       */

    }, {
      key: '$registerSyntax',
      value: function $registerSyntax(name, syntax, shell) {
        var _this6 = this;

        if (2 < arguments.length) {
          this._blocks[name] = {
            syntax: is('RegExp')(syntax) ? syntax : this._compileRegexp('<%= openTag %>' + syntax + '<%= closeTag %>', 'igm'),
            shell: is('Function')(shell) ? shell : '<%' + this._compile(shell) + '%>'
          };
        } else if (is('PlainObject')(syntax)) {
          forEach(syntax, function (shell, syntax) {
            _this6.$registerSyntax(name, syntax, shell);
          });
        } else if (is('Array')(syntax)) {
          forEach(syntax, function (compiler) {
            is('String')(compiler.syntax) && (is('String')(compiler.shell) || is('Function')(compiler.shell)) && _this6.$registerSyntax(name, compiler.syntax, compiler.shell);
          });
        }

        return this;
      }

      /**
       * 销毁语法
       * @function
       * @param {string} name 语法名称
       * @returns {Syntax}
       */

    }, {
      key: '$unregisterSyntax',
      value: function $unregisterSyntax(name) {
        var blocks = this._blocks;

        if (blocks.hasOwnProperty(name)) {
          blocks[name] = undefined;
          delete blocks[name];
        }

        return this;
      }

      /**
       * 查询/设置块级辅助函数
       * @function
       * @param {string|object} query 需要查找或设置的函数名|需要设置辅助函数集合
       * @param {function} callback 回调函数
       * @returns {this|function}
       * @description
       * 只有语法版本才拥有 block 这个概念，原生版本可以通过各种函数达到目的
       */

    }, {
      key: 'block',
      value: function block(query, callback) {
        if (1 < arguments.length) {
          if (is('String')(query) && is('Function')(callback)) {
            this.$registerSyntax(query + 'open', '(' + query + ')\\s*(,?\\s*([\\w\\W]+?))\\s*(:\\s*([\\w\\W]+?))?\\s*', function ($all, $1, $2, $3, $4, $5) {
              return '<%' + $1 + '($append, ' + ($2 ? $2 + ', ' : '') + 'function (' + ($5 || '') + ') {\'use strict\';var $buffer=\'\';%>';
            }).$registerSyntax(query + 'close', '/' + query, 'return $buffer;});');

            this._blockHelpers[query] = function ($append) {
              var args = Array.prototype.splice.call(arguments, 1);
              $append(callback.apply(this, args));
            };
          }
        } else {
          if (is('String')(query)) {
            return this._blockHelpers[query];
          }

          if (is('PlainObject')(query)) {
            for (var name in query) {
              this.block(name, query[name]);
            }
          }
        }

        return this;
      }

      /**
       * 注销块级辅助函数
       * @function
       * @param {string} name 名称
       * @returns {Syntax}
       */

    }, {
      key: 'unblock',
      value: function unblock(name) {
        var helpers = this._blockHelpers;
        var blocks = this._blocks;

        if (helpers.hasOwnProperty(name)) {
          helpers[name] = undefined;
          blocks[name + 'open'] = undefined;
          blocks[name + 'close'] = undefined;

          delete helpers[name];
          delete blocks[name + 'open'];
          delete blocks[name + 'close'];
        }

        return this;
      }
    }]);

    return Syntax;
  }(Engine);

  ;
  var fs = require('fs');

  /**
   * 服务器接口类
   * @class
   */

  var Server = function () {
    function Server() {
      _classCallCheck(this, Server);
    }

    _createClass(Server, [{
      key: 'readFile',

      /**
       * 读取文件
       * @function
       * @param  {String}   filename 文件名
       * @param  {Function} callback 回调函数
       */
      value: function readFile(filename, callback) {
        if (is('Function')(callback)) {
          fs.readFile(filename, function (err, buffer) {
            callback(buffer.toString());
          });
        }
      }
    }, {
      key: 'reunder',
      value: function reunder(filename, callback) {}
    }]);

    return Server;
  }();

  module.exports = new oTemplate();
}(window);
