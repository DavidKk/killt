OTemplate.extend(function() {

  var self = this

  this.block('markdown', function() {

  })

  this
    .$registerSyntax('mdopen', 'markdown', 'markdown(function() {')
    .$registerSyntax('mdclose', '/markdown', '});')

  ~extend(this._helpers, {
    markdown: function() {

    }
  })
})