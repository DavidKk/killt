OTemplate._defaults = extend(OTemplate._defaults, {
  noSyntax: true
})

OTemplate._extends = function() {
  this
    .$registerSyntax('if@ifopen', 'if\\s*(.+)?\\s*', 'if($1) {')
    .$registerSyntax('else@ifopen', 'else', '} else {')
    .$registerSyntax('elseif@ifopen', 'else\\s*if\\s*(.+)?\\s*', '} else if($1) {')
    .$registerSyntax('if@ifclose', '\\/if', '}')
    .$registerSyntax('each@eachopen', 'each\\s*([^\\s]+)?\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', 'each($1, function($3$4) {')
    .$registerSyntax('each@eachclose', '\\/each', '})')
    .$registerSyntax('include', 'include\\s*([^\\s,]+)?\\s*(,\\s*[^\\s+]+)?\\s*', 'include($1$2)')
    .$registerSyntax('escape', '#\\s*([^\\s]+)?\\s*', 'escape($1)')
    .$registerSyntax('helper', '\\s*(\\w*\\s*\\\()*([^<%= closeTag %>]*?)\\s*\\|\\s*([\\w]*?)\\s*(:\\s*([,\\w]*?))?(\\\))*\\s*', '$3(<%= openTag %>$2<%= closeTag %>,$5)', true)

  ~extend(this._helpers, {
    include: function(path) {
      return ''
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
 * @param  {String}               name       语法名称
 * @param  {String|Array|Object}  var_syntax 语法正则 (请使用非贪婪匹配的正则表达式)
 * @param  {String}               shell      元脚本
 * @param  {Boolean}              repeat     是否递推到不能匹配才停止
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
OTemplate.prototype.$registerSyntax = function(name, var_syntax, shell, repeat) {
  var self = this

  if (2 < arguments.length) {
    this._blocks[name] = {
      syntax: this.$$compileRegexp('<%= openTag %>' + var_syntax + '<%= closeTag %>', 'igm'),
      shell: '<%' + this.$$compile(shell) + '%>',
      repeat: true === repeat
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
      && isString(compiler.shell)
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
      shell,
      valid

  forEach(this._blocks, function(handle) {
    var lastCompiled = source.replace(handle.syntax, handle.shell)

    if (handle.repeat) {
      while(source !== lastCompiled) {
        source = lastCompiled
        lastCompiled = source.replace(handle.syntax, handle.shell)
      }
    }

    source = lastCompiled
  })

  shell = source
    .replace(/<%(.*)(<%)+?(.*)(%>)+?(.*)%>/igm, '<%$1$3$5%>')
    .replace(this.$$compileRegexp('<%(.*)?<%= openTag %>(.*)?<%= closeTag %>(.*)?%>', 'igm'), '<%$1$2$3%>')

  // 检测一下是否存在未匹配语法
  return strict ? (true === (valid = this.$analyzeSyntax(shell, false)) ? shell : (this.$$throw(valid) || '')) : this.$clearSyntax(shell)
}
