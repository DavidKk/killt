<script id="template/a.html" type="template/text">
  <div><%= $block %></div>
</script>

<%mixin("template/a.html", $data, function() {%>
  <span>Hello World</span>
<%})%>

mixin = function(file, $data, blockShell) {
  reunder(file, extend($data, {
    $block: blockShell(??)
  }))
}

跨作用域的问题