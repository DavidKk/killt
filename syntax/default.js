/**
 * Simple Syntax Defination/定义简单语法
 * @description
 * `if`:      {{if true}}...{{elseif}}...{{else}}...{{/if}}
 * `each`:    {{each data as value,key}}...{{/each}}
 * `include`: {{include "/templates/index.html", data}}
 * `escape`:  {{# "<div></div>"}}
 * `helper`:  {{data | helperA:dataA,dataB,dataC | helperB:dataD,dataE,dataF}}
 */
OTemplate.extend(function() {
  var HELPER_SYNTAX = '(!?#?)\\s*([^\\|]+)?\\s*\\|\\s*([\\w$]+)?(:([,\\w$]+)?)?(.*)',
      HELPER_REGEXP = this.$$compileRegexp(HELPER_SYNTAX)

  this
    .$registerSyntax('echo', '@\\s*([^<%= closeTag %>]+)?\\s*', '=$1')
    .$registerSyntax('ifopen', 'if\\s*(.+)?\\s*', 'if($1) {')
    .$registerSyntax('else', 'else', '} else {')
    .$registerSyntax('elseif', 'else\\s*if\\s*(.+)?\\s*', '} else if($1) {')
    .$registerSyntax('ifclose', '\\/if', '}')
    .$registerSyntax('eachopen', 'each\\s*([^\\s]+)?\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', function($all, $1, $2, $3, $4) {
        var str = 'each(' + $1 + ', function(' + ($3 || '$value') + ($4 || ', $index') + ') {'
        return '<%' + str + '%>'
      })
    .$registerSyntax('eachclose', '\\/each', '})')
    .$registerSyntax('include', 'include\\s*([^\\s,]+)?\\s*(,\\s*[^\\s+]+)?\\s*', function($all, $1, $2) {
      return '<%#include(' + $1 + ($2 ? $2 : ', $datas') + ')%>'
    })
    .$registerSyntax('noescape', '#\\s*([^\\s]+)?\\s*', '#$1')
    .$registerSyntax('escape', '!#\\s*([^\\s]+)?\\s*', '!#$1')
    .$registerSyntax('helper', HELPER_SYNTAX, (function() {
        return function($all, $1, $2, $3, $4, $5, $6) {
          var str = format.apply(this, arguments)
          while(HELPER_REGEXP.exec(str)) {
            str = str.replace(HELPER_REGEXP, format)
          }

          return '<%' + toString($1) + str + '%>'
        }

        function format($all, $1, $2, $3, $4, $5, $6) {
          return $3 + '(' + trim($2) + ($5 ? ',' + $5 : '') + ')' + ($6 ? $6.replace(/^\s*$/, '') : '')
        }
      })())

  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
})