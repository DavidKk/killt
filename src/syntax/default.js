/**
 * Simple Syntax Defination - 定义简单语法
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
  var HELPER_SYNTAX       = '(!?#?)\\s*([^|]+?(?:\\s*(?:\\|\\||\\&\\&)\\s*[^|]+?)*)\\s*\\|\\s*([^:\\|]+?)\\s*(?:\\:\\s*([^\\|]+?))?\\s*(\\|\\s*[\\w\\W]+?)?',
      HELPER_REGEXP       = this.$$compileRegexp(HELPER_SYNTAX),
      HELPER_INNER_SYNTAX = '\\s*([\\w\\W]+?\\s*\\\([\\w\\W]+?\\\))\\s*\\|\\s*([^:]+?)\\s*(:\\s*([^\\|]+?))?$',
      HELPER_INNER_REGEXP = this.$$compileRegexp(HELPER_INNER_SYNTAX)

  this
  .$registerSyntax('echo', '@\\s*([\\w\\W]+?)\\s*', '=$1')
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
    return function($all, $1, $2, $3, $4, $5) {
      var str = format.apply(this, arguments)
      while (HELPER_INNER_REGEXP.exec(str)) {
        str = str.replace(HELPER_INNER_REGEXP, innerFormat)
      }

      return '<%' + toString($1) + str + '%>'
    }

    function format($all, $1, $2, $3, $4, $5) {
      return $3 + '(' + trim($2) + ($4 ? ',' + $4 : '') + ')' + ($5 ? $5.replace(/^\s*$/, '') : '')
    }

    function innerFormat($all, $1, $2, $3, $4) {
      return $2 + '(' + $1 + ',' + $4 + ')'
    }
  })())
  .$registerSyntax('logic', '-\\s*(.+?)\\s*', '$1')

  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
})