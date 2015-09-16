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
 */
OTemplate.prototype.block = function(var_query, callback) {
  if (1 < arguments.length) {
    if (isString(var_query) && isFunction(callback)) {
      this
        .$registerSyntax(var_query + 'open', '(' + var_query + ')\\s*(,?\\s*([\\w\\W]+?))\\s*(:\\s*([\\w\\W]+?))?\\s*', function($all, $1, $2, $3, $4, $5) {
          return '<%' + $1 + '(' + ($2 ? $2 + ',' : '') + '$append, function(' + $5 + ') {"use strict";var $buffer="";%>'
        })
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
