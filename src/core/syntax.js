/**
 * Syntax Module - 语法模块
 * @type {Object}
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
DEFAULTS.noSyntax = false

class Syntax extends Bone {
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
  _compile (source, data) {
    data = is('PlainObject')(data) ? data : this.DEFAULTS

    return source.replace(/<%=\s*([^\s]+?)\s*%>/igm, function (all, $1) {
      return get(data, $1) || ''
    })
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
  _compileRegexp (patternTemplate, attributes) {
    let pattern = this._compile(patternTemplate)
    return new RegExp(pattern, attributes)
  }

  /**
   * 注册语法
   * @function
   * @param {string} name 语法名称
   * @param {string|array|object|regexp} syntax 语法正则 (请注意贪婪与贪婪模式)，当为 RegExp时，记得用 openTag 和 closeTag 包裹
   * @param {string|function} shell 元脚本, 当为 Function 时记得加上 `<%` 和 `%>` 包裹
   * @returns {Bone}
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
  $registerSyntax (name, syntax, shell) {
    let self = this

    if (2 < arguments.length) {
      this._blocks[name] = {
        syntax  : is('RegExp')(syntax) ? syntax : this._compileRegexp(`<%= openTag %>${syntax}<%= closeTag %>`, 'igm'),
        shell   : is('Function')(shell) ? shell : `<%${this._compile(shell)}%>`
      }
    }
    else if (is('PlainObject')(syntax)) {
      forEach(syntax, function (shell, syntax) {
        self.$registerSyntax(name, syntax, shell)
      })
    }
    else if (is('Array')(syntax)) {
      forEach(syntax, function (compiler) {
        is('String')(compiler.syntax)
        && is('String')(compiler.shell) || is('Function')(compiler.shell)
        && self.$registerSyntax(name, compiler.syntax, compiler.shell)
      })
    }

    return this
  }

  /**
   * 销毁语法
   * @function
   * @param {string} name 语法名称
   * @returns {Bone}
   */
  $unregisterSyntax (name) {
    let blocks = this._blocks
    if (blocks.hasOwnProperty(name)) {
      delete blocks[name]
    }

    return this
  }

  /**
   * 清除所有语法
   * @function
   * @param {string} source 语法模板
   * @returns {string}
   */
  $clearSyntax (source) {
    let regexp = this._compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm')
    return source.replace(regexp, '')
  }

  /**
   * 分析语法是否合格
   * @function
   * @param {string} source 语法模板
   * @param {boolean} compile 是否需要编译
   * @returns {string|boolean}
   */
  $analyzeSyntax (source, compile, origin = '') {
    let tpl = source

    if (compile) {
      forEach(this._blocks, function (handle) {
        tpl = tpl.replace(handle.syntax, '')
      })
    }

    // error open or close tag - 语法错误，缺少闭合
    let tagReg   = this._compileRegexp('<%= openTag %>|<%= closeTag %>', 'igm'),
        stripTpl = this.$clearSyntax(tpl),
        pos      = stripTpl.search(tagReg)

    if (-1 !== pos) {
      let line = inline(stripTpl, pos)

      return {
        message : `[Syntax Error]: Syntax error in line ${line}.`,
        syntax  : this._table(origin, line)
      }
    }

    // not match any syntax or helper - 语法错误，没有匹配到相关语法
    let syntaxReg = this._compileRegexp('<%= openTag %>(.*)?<%= closeTag %>', 'igm'),
        match     = source.match(syntaxReg)

    if (match) {
      pos = tpl.search(syntaxReg)

      let line = inline(tpl, pos)

      return {
        message : `[Syntax Error]: ${match[0]} did not match any syntax in line ${line}.`,
        syntax  : this._table(tpl, line)
      }
    }

    return true
  }

  /**
   * 编译语法模板
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
  $compileSyntax (source, strict) {
    strict = !(false === strict)

    let [origin, conf, blocks, valid] = [source, this.DEFAULTS, this._blocks]

    /**
     * 删除所有字符串中的标签
     * @function
     * @param  {string} source HTML
     * @return {string}
     */
    let clearTagsFromString = function (source) {
      let clearTags = function ($all, $1, $2, $3) {
        return `${$1}${$2.replace(new RegExp(`${conf.openTag}|${conf.closeTag}`, 'gim'), function ($all) {
          return $all.replace(new RegExp(`(${$all.split('').join('|')})`, 'gim'), '\\$1')
        })}${$3}`
      }

      return source
        .replace(new RegExp(`(\')([\\w\\W]+?)(\')`, 'gim'), clearTags)
        .replace(new RegExp(`(\")([\\w\\W]+?)(\")`, 'gim'), clearTags)
        .replace(new RegExp(`(\`)([\\w\\W]+?)(\`)`, 'gim'), clearTags)
    }

    source = clearTagsFromString(source)

    /**
     * 分割标签，这样可以将所有正则都匹配每一个标签而不是整个字符串。
     * 若匹配整个字符串容易出现多余匹配问题。
     *
     * split tags, because regexp may match all the string.
     * it can make every regexp match each string between tags(openTag & closeTag)
     */
    forEach(source.split(conf.openTag), function(code) {
      let codes = code.split(conf.closeTag)

      if (1 !== codes.length) {
        source = source.replace(`${conf.openTag}${codes[0]}${conf.closeTag}`, function($all) {
          let string = $all

          forEach(blocks, function (handle) {
            let str = string.replace(handle.syntax, handle.shell)
            if (str !== string) {
              string = str
              return true
            }
          })

          return string
        })
      }
    })

    // 检测一下是否存在未匹配语法
    return strict
      ? (true === (valid = this.$analyzeSyntax(source, false, origin))
          ? source
          : (this._throw(valid) || ''))
      : this.$clearSyntax(source)
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
  block (query, callback) {
    if (1 < arguments.length) {
      if (is('String')(query) && is('Function')(callback)) {
        this
          .$registerSyntax(`${query}open`, `(${query})\\s*(,?\\s*([\\w\\W]+?))\\s*(:\\s*([\\w\\W]+?))?\\s*`, function ($all, $1, $2, $3, $4, $5) {
            return `<%${$1}($append, ${$2 ? $2 + ', ' : ''}function (${$5 || ''}) {'use strict';var $buffer='';%>`
          })
          .$registerSyntax(`${query}close`, `/${query}`, `return $buffer;});`)
          ._blockHelpers[query] = function ($append) {
            let args = Array.prototype.splice.call(arguments, 1)
            $append(callback.apply(this, args))
          }
      }
    }
    else {
      if (is('String')(query)) {
        return this._blockHelpers[query]
      }

      if (is('PlainObject')(query)) {
        for (let name in query) {
          this.block(name, query[name])
        }
      }
    }

    return this
  }

  /**
   * 注销块级辅助函数
   * @function
   * @param {string} name 名称
   * @returns {Bone}
   */
  unblock (name) {
    let helpers = this._blockHelpers,
        blocks  = this._blocks

    if (helpers.hasOwnProperty(name)) {
      delete helpers[name]
      delete blocks[`${name}open`]
      delete blocks[`${name}close`]
    }

    return this
  }
}
