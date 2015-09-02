function readFile(filename, callback) {
  if (!isFunction(callback)) {
    return
  }

  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    this.DONE === this.readyState && callback(this.responseText)
  }

  xhr.onerror = xhr.ontimeout = xhr.onabort = function() {
    callback('')
  }

  xhr.open('GET', filename, true)
  xhr.send(null)
}