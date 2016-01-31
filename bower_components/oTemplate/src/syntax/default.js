/**
 * Simple Syntax Defination - 定义简单语法
 */
Bone.extend(function() {
  let HELPER_SYNTAX       = '(=|-|!|#|!#)?\\s*([^|]+?(?:\\s*(?:\\|\\||\\&\\&)\\s*[^|]+?)*)\\s*\\|\\s*([^:\\|]+?)\\s*(?:\\:\\s*([^\\|]+?))?\\s*(\\|\\s*[\\w\\W]+?)?',
      HELPER_REGEXP       = this._compileRegexp(HELPER_SYNTAX),
      HELPER_INNER_SYNTAX = '\\s*([\\w\\W]+?\\s*\\\([\\w\\W]+?\\\))\\s*\\|\\s*([^:]+?)\\s*(:\\s*([^\\|]+?))?$',
      HELPER_INNER_REGEXP = this._compileRegexp(HELPER_INNER_SYNTAX)

  this
  /**
   * helper syntax
   * syntax {{ data | helperA: dataA, dataB, dataC | helperB: dataD, dataE, dataF }}
   */
  .$registerSyntax('helper', HELPER_SYNTAX, (function() {
    return function($all, $1, $2, $3, $4, $5) {
      let str = format.apply(this, arguments)

      // 这里需要递推所有的辅助函数
      while (HELPER_INNER_REGEXP.exec(str)) {
        str = str.replace(HELPER_INNER_REGEXP, innerFormat)
      }

      return `<%${toString($1)}${str}%>`
    }

    function format ($all, $1, $2, $3, $4, $5) {
      return `${$3}(${trim($2)}${$4 ? ',' + $4 : ''})${$5 ? $5.replace(/^\s*$/, '') : ''}`
    }

    function innerFormat ($all, $1, $2, $3, $4) {
      return `${$2}(${$1},${$4})`
    }
  })())

  /**
   * echo something
   * syntax {{= 'hello world' }}
   */
  .$registerSyntax('echo', '=\\s*([\\w\\W]+?)\\s*', '=$1')
  /**
   * do some javascript
   * syntax {{- var sayWhat = 'hello world' }}
   */
  .$registerSyntax('logic', '-\\s*([\\w\\W]+?)\\s*', '$1')
  /**
   * do not escape html, sometime it not safe
   * syntax {{# "<script></script>" }}
   */
  .$registerSyntax('noescape', '#\\s*([\\w\\W]+?)\\s*', '#$1')
  /**
   * escape html, it can not be used when `DEAUTIFUL.escape === true`
   * syntax {{!# "<script></script>" }}
   */
  .$registerSyntax('escape', '!#\\s*([\\w\\W]+?)\\s*', '!#$1')
  /**
   * if open tag and corresponding to ifclose (block syntax)
   * syntax {{if true}} Hello World {{/if}}
   */
  .$registerSyntax('ifopen', 'if\\s*(.+?)\\s*', 'if ($1) {')
  /**
   * else tag between if and ifclose tag
   * syntax {{if false}} {{else}} Hello World {{/if}}
   */
  .$registerSyntax('else', 'else', '} else {')
  /**
   * elseif tag,  a special tag for if tag
   * syntax {{if false}} {{elseif true}} Hello World {{/if}}
   */
  .$registerSyntax('elseif', 'else\\s*if\\s*(.+?)\\s*', '} else if ($1) {')
  /**
   * if close tag
   * syntax {{if true}} Hello World {{/if}}
   */
  .$registerSyntax('ifclose', '\\/if', '}')
  /**
   * each open tag. iterate data one by one
   * syntax {{each data as value, key}} {{= key + '=>' + value }} {{/each}}
   */
  .$registerSyntax('eachopen', 'each\\s*([\\w\\W]+?)\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', function($all, $1, $2, $3, $4) {
    let string = `each(${$1}, function(${$3 || '$value'}${$4 || ', $index'}) {`
    return `<%${string}%>`
  })
  /**
   * each close tag
   * syntax {{each data as value, key}} {{= key + '=>' + value }} {{/each}}
   */
  .$registerSyntax('eachclose', '\\/each', '})')
  /*
   * include another template
   * syntax {{include template/index.html [, ...(optional)] }}
   */
  .$registerSyntax('include', 'include\\s*([\\w\\W]+?)\\s*(,\\s*([\\w\\W]+?))?\\s*', function($all, $1, $2, $3) {
    return `<%#include('${$1.replace(/[\'\"\`]/g, '')}', ${$3 || '$data'})%>`
  })

  // add a each syntax helper
  // 添加语法辅助函数
  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
})