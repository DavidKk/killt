/**
 * 获取所在行
 * @function
 * @param  {string} str
 * @param  {number} pos
 * @return {number}
 */
function inline(str, pos) {
  return (str.substr(0, pos).match(/\n/g) || []).length +1
}

/**
 * 判断对象是否为 type 类型
 * @function
 * @param  {string} type
 * @return {function}
 */
function is(type) {
  // 是否未定义
  if ('Undefined' === type) {
    return function(o) {
      return 'undefined' === typeof o
    }
  }

  // 是否定义
  if ('Defined' === type) {
    return function(o) {
      return 'undefined' !== typeof o
    }
  }

  // 是否为一个整数
  if ('Integer' === type) {
    return function(o) {
      var y = parseInt(o, 10)
      return !isNaN(y) && o === y && o.toString() === y.toString()
    }
  }

  // 是否为一个纯对象
  if ('PlainObject' === type) {
    return function(o) {
      var ctor,
          prot

      if (false === is('Object')(o) || is('Undefined')(o)) {
          return false
      }

      ctor = o.constructor
      if ('function' !== typeof ctor) {
          return false
      }
      
      prot = ctor.prototype;
      if (false === is('Object')(prot)) {
          return false
      }
      
      if (false === prot.hasOwnProperty('isPrototypeOf')) {
          return false
      }
      
      return true
    }
  }

  return function(o) {
    return '[object ' + type + ']' === Object.prototype.toString.call(o)
  }
}


/**
 * 去除空格
 * @trim
 * @param  {string}     str
 * @return {string}
 */
function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

/**
 * 查找对象中的属性
 * @function
 * @param  {string}     query
 * @param  {object}     space 获取的对象
 * @param  {string}     token 分割 token
 * @return {anything}         若不存在返回 undefined，若存在则返回该指向的值
 * @example
 * {a:{a:{a:{a:1}}}} -> $.namespace('a.a.a.a') -> 1
 * {a:1}             -> $.namespace('a.a.a.a') -> undefined
 */
function namespace(query, space, token) {
  if (!is('String')(query)) {
    return undefined
  }

  var re = space,
      ns = query.split(token || '.'),
      i = 0,
      l = ns.length

  for (; i < l; i ++) {
    if (is('Undefined')(re[ns[i]])) {
        return undefined
    }

    re = re[ns[i]]
  }

  return is('Undefined')(re) ? undefined : re
}

/**
 * 强制转化成字符串
 * @function
 * @param  {anything} value 传入的值
 * @return {string}
 */
function toString(value) {
  if (is('String')(value)) {
    return value
  }

  if (is('Number')(value)) {
    return value += ''
  }

  if (is('Function')(value)) {
    return toString(value.call(value))
  }

  return ''
}

/**
 * 转义标点符号
 * @function
 * @param  {string} a 需要转义的字符串
 * @return {string}
 */
function escapeSymbol(a) {
  return a
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * 转义HTML字符
 * @function
 * @param  {string} content HTML字符
 * @return {string}
 */
function escapeHTML(content) {
  return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeHTML.escapeFn)
}

/**
 * 转义资源
 * @type {Object}
 */
escapeHTML.SOURCES = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2f;'
}

/**
 * 转义函数
 * @param  {string} name 转义字符
 * @return {string}
 */
escapeHTML.escapeFn = function(name) {
  return escapeHTML.SOURCES[name]
}

/**
 * 遍历数组或对象
 * @function
 * @param {array|object}  a        数组或对象
 * @param {function}      callback 回调函数
 */
function forEach(a, callback) {
  if (is('Function')(callback)) {
    var i
    if (is('Array')(a)) {
      if (Array.prototype.some) {
        a.some(callback)
      }
      else {
        var l = a.length
        for (i = 0; i < l; i ++) {
          if (true === callback(a[i], i)) {
            break
          }
        }
      }
    }
    else if (is('Object')(a)) {
      for (i in a) {
        if (true === callback(a[i], i)) {
          break
        }
      }
    }
  }
}

/**
 * 去重
 * @function
 * @param  {array} a 需要去重数组
 * @return {array}
 */
function unique(a) {
  var n = {},
      r = [],
      i = a.length

  for (;i --;) {
    if (!n.hasOwnProperty(a[i])) {
      r.push(a[i])
      n[a[i]] = 1
    }
  }

  return r
}

/**
 * 过滤
 * @function
 * @param  {object|Array}   collection  需要过滤的元素
 * @param  {function}       callback    回调函数
 * @return {object|Array}
 */
function filter(collection, callback) {
  var isArr = is('Array')(collection),
      res = isArr ? [] : {}

  forEach(collection, function(val, key) {
    if (callback(val, key)) {
      res[isArr ? res.length : key] = val
    }
  })

  return res
}

/**
 * 合并数组或对象
 * @function
 * @param  {array|object} a 数组或对象
 * @param  {array|object} b 数组或对象
 * @return {array|object} 返回 a 元素
 */
function extend(a, b) {
  if (arguments.length > 2) {
    a = extend(a, b)
    var next = Array.prototype.slice.call(arguments, 2, arguments.length)
    return extend(a, next[0])
  }

  if (is('Array')(a) && is('Array')(b)) {
    Array.prototype.splice.apply(a, [a.length, 0].concat(b))
  }
  else if (is('PlainObject')(a) && is('PlainObject')(b)) {
    for (var i in b) {
      a[i] = b[i]
    }
  }

  return a
}

/**
 * 获取元素在数组中所在位置的键值
 * @function
 * @param  {anything} value 要获取键值的元素
 * @param  {array}    array 数组
 * @return {Integer}        键值，不存在返回 -1;
 */
function inArray(value, array) {
  if (Array.prototype.indexOf && is('Function')(array.indexOf)) {
    return array.indexOf(value)
  }
  else {
    for (var i = 0; i < array.length; i ++) {
      if (array[i] === value) return i
    }

    return -1
  }
}

/**
 * inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @function
 * @param  {object|Integer} var_query 对象或数字(数字用于数组下标)
 * @return {Integer}                  键值，不存在返回 -1;
 */
function inArrayBy(var_query, array, index_name) {
  var index,
      i = 0,
      l = array.length

  index = is('Object')(var_query)
    ? var_query[index_name]
    : index = var_query

  for (; i < l; i ++) {
    if (index == array[i][index_name]) {
      return i
    }
  }

  return -1
};

/**
 * 抛出异常
 * @function
 * @param  {string|object} error  错误异常
 * @param  {boolean}       type   是否捕获事件
 */
function __throw(error, type) {
  type = is('String')(type) ? type : 'log'

  var message = ''
  if (is('Object')(error)) {
    forEach(error, function(value, name) {
      message += '<' + name.substr(0, 1).toUpperCase() + name.substr(1) + '>\n' + value + '\n\n'
    })
  }
  else if (is('String')(error)) {
    message = error
  }
  
  if ('log' === type) {
    is('Defined')(console) && is('Function')(console.error)
      ? console.error(message)
      : _throw(message)
  }
  else if ('catch' === type) {
    _throw(message)
  }

  return message

  function _throw(message) {
    setTimeout(function() {
      throw message
    })
  }
}

/**
 * 伪渲染函数
 * @function
 * @return {string}
 */
function __render() {
  return ''
}

/**
 * UMD 模块定义
 * @function
 * @param {windows|global} root
 * @param {function} factory
 */
function UMD(name, factory, root) {
  var define = window.define

  // AMD & CMD
  if ('function' === typeof define) {
    define(function() {
      return factory(root)
    })
  }
  // NodeJS
  else if ('object' === typeof exports) {
    module.exports = factory(root)
  }
  // no module definaction
  else {
    root[name] = factory(root)
  }
}