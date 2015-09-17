/**
 * @function inline 所在行
 * @param  {String} str
 * @param  {Number} pos
 * @return {Number}
 */
function inline(str, pos) {
  return (str.substr(0, pos).match(/\n/g) || []).length +1
}

/**
 * @function is 判断对象是否为 type 类型
 * @param  {String} type
 * @return {Function}
 *   @param {Anything} elem 要判断的对象
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
 * @trim 去除空格
 * @param  {String}     str
 * @return {String}
 */
function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

/**
 * @function namespace 查找对象中的属性
 * @param  {String}     query
 * @param  {Object}     space 获取的对象
 * @param  {String}     token 分割 token
 * @return {Anything} 若不存在返回 undefined，若存在则返回该指向的值
 * 
 * @example
 *     {a:{a:{a:{a:1}}}} -> $.namespace('a.a.a.a') -> 1
 *     {a:1}             -> $.namespace('a.a.a.a') -> undefined
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
 * @function toString 强制转化成字符串
 * @param  {Anything} value 传入的值
 * @return {String}
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
 * @function escapeSymbol 转义标点符号
 * @param  {String} a 需要转义的字符串
 * @return {String}
 */
function escapeSymbol(a) {
  return a
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * @function escapeHTML 转义HTML字符
 * @param  {String} content HTML字符
 * @return {String}
 */
function escapeHTML(content) {
  return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeHTML.escapeFn)
}

escapeHTML.SOURCES = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2f;'
}

escapeHTML.escapeFn = function(name) {
  return escapeHTML.SOURCES[name]
}

/**
 * @function forEach 遍历数组或对象
 * @param {Array|Object}  a        数组或对象
 * @param {Function}      callback 回调函数
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
 * @function unique 去重
 * @param  {Array} a 需要去重数组
 * @return {Array}
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
 * @function filter 过滤
 * @param  {Object|Array}   collection  需要过滤的元素
 * @param  {Function}       callback    回调函数
 * @return {Object|Array}
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
 * @function extend 合并数组或对象
 * @param  {Array|Object} a 数组或对象
 * @param  {Array|Object} b 数组或对象
 * @return {Array|Object} 返回 a 元素
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
 * @functioninArray 获取元素在数组中所在位置的键值
 * @param  {Anything} value 要获取键值的元素
 * @param  {Array}    array 数组
 * @return {Integer}        键值，不存在返回 -1;
 */
function inArray(value, array) {
  if (Array.prototype.indexOf && angular.isFunction(array.indexOf)) {
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
 * @function inArrayBy inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @param  {Object|Integer} var_query 对象或数字(数字用于数组下标)
 * @return {Integer}                  键值，不存在返回 -1;
 */
function inArrayBy(var_query, array, index_name) {
  var index,
      i = 0,
      l = array.length

  index = angular.isObject(var_query)
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
 * @function __throw 抛出异常
 * @param  {String|Object} error  错误异常
 * @param  {Boolean}       type   是否捕获事件
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
 * @function __render 伪渲染函数
 * @return {String}
 */
function __render() {
  return ''
}

/**
 * @function UMD
 * @param {windows|global} root
 * @param {Function} factory
 */
function UMD(name, factory, root) {
  'function' === typeof define
    // AMD & CMD
    ? define(function() {
        return factory(root)
      })
    : 'object' === typeof exports
      // nodejs
      ? module.exports = factory(root)
      // no module definaction
      : root[name] = factory(root)
}