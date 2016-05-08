if ('undefined' === typeof root) {
  var root

  if ('undefined' !== typeof global) {
    root = global
  }
  else if ('undefined' !== typeof window) {
    root = window
  }
  else {
    root = {}
  }
}