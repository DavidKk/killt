OTemplate._extends = function() {
  var HELPER_SYNTAX = '\\s*([^\\s\\|]+)?\\s*\\|\\s*([\\w]+)?(:([,\\w]+)?)?(.*)',
      HELPER_REGEXP = this.$$compileRegexp(HELPER_SYNTAX)

  this
    .$registerSyntax('echo', '@\\s*([^<%= closeTag %>]+)?\\s*', '=$1')
    .$registerSyntax('ifopen', 'if\\s*(.+)?\\s*', 'if($1) {')
    .$registerSyntax('else', 'else', '} else {')
    .$registerSyntax('elseif', 'else\\s*if\\s*(.+)?\\s*', '} else if($1) {')
    .$registerSyntax('ifclose', '\\/if', '}')
    .$registerSyntax('eachopen', 'each\\s*([^\\s]+)?\\s*(as\\s*(\\w*?)\\s*(,\\s*\\w*?)?)?\\s*', 'each($1, function($3$4) {')
    .$registerSyntax('eachclose', '\\/each', '})')
    .$registerSyntax('include', 'include\\s*([^\\s,]+)?\\s*(,\\s*[^\\s+]+)?\\s*', 'include($1$2)')
    .$registerSyntax('escape', '#\\s*([^\\s]+)?\\s*', 'escape($1)')
    .$registerSyntax('helper', HELPER_SYNTAX, (function() {
        return function($all, $1, $2, $3, $4, $5) {
          var str = format.apply(this, arguments)
          while(HELPER_REGEXP.exec(str)) {
            str = str.replace(HELPER_REGEXP, format)
          }

          return '<%' + str + '%>'
        }

        function format($all, $1, $2, $3, $4, $5) {
          return $2 + '(' + $1 + ($4 ? ',' + $4 : '') + ')' + ($5 ? $5.replace(/^\s*$/, '') : '')
        }
      })())

  ~extend(this._helpers, {
    each: function(data, callback) {
      forEach(data, callback)
    }
  })
}