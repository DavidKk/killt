/**
 * 判断类型
 * @typedef {isType}
 * @param {*} value 需要判断的值
 * @returns {boolean} 是否为该类型
 */

/**
 * 判断对象是否为 type 类型
 * @param {string} type 类型
 * @return {isType} 判断类型函数
 */
function is (type) {
  return function (value) {
    switch (type) {
      case 'Undefined':
        return 'undefined' === typeof value

      case 'Defined':
        return 'undefined' !== typeof value

      case 'Integer':
        let y = parseInt(value, 10)
        return !isNaN(y) && value === y && value.toString() === y.toString()

      case 'PlainObject':
        let ctor, prot
        if (false === is('Object')(value) || is('Undefined')(value)) {
            return false
        }

        ctor = value.constructor
        if ('function' !== typeof ctor) {
            return false
        }

        prot = ctor.prototype
        if (false === is('Object')(prot)) {
            return false
        }

        if (false === prot.hasOwnProperty('isPrototypeOf')) {
            return false
        }

        return true

      default:
        return `[object ${type}]` === Object.prototype.toString.call(value)
    }
  }
}

/**
 * 获取所在行
 * @param {string} string 需要查找的值
 * @param {number} position 编译
 * @returns {number} 行数
 */
function inline (string, position) {
  return (string.substr(0, position).match(/\n/g) || []).length + 1
}

/**
 * 去除空格
 * @param {string} string 字符串
 * @return {string} 结果字符串
 */
function trim (string) {
  return toString(string).replace(/^\s+|\s+$/, '')
}

/**
 * 查找对象中的属性
 * @param {Object} object 获取的对象
 * @param {string} path 查找路径
 * @param {string} spliter 分隔符 (默认为 `.`)
 * @returns {*} 若不存在返回 undefined，若存在则返回该指向的值
 * @example
 * {a:{a:{a:{a:1}}}} -> get('a.a.a.a') -> 1
 * {a:1}             -> get('a.a.a.a') -> undefined
 */
function get (object, path, spliter = '.') {
  if (!is('String')(path)) {
    return undefined
  }

  let [re, ns] = [object, path.split(spliter)]
  for (let i = 0, l = ns.length; i < l; i ++) {
    if (is('Undefined')(re[ns[i]])) {
        return undefined
    }

    re = re[ns[i]]
  }

  return is('Undefined')(re) ? undefined : re
}

/**
 * 强制转化成字符串
 * @param {*} anything 传入的值
 * @returns {string} 结果字符串
 */
function toString (anything) {
  if (is('String')(anything)) {
    return anything
  }

  if (is('Number')(anything)) {
    anything += ''
    return anything
  }

  if (is('Function')(anything)) {
    return toString(anything.call(anything))
  }

  return ''
}

/**
 * 转义标点符号
 * @param {string} string 需要转义的字符串
 * @returns {string} 结果字符串
 */
function escapeSymbol (string = '') {
  return string
  .replace(/("|'|\\)/g, '\\$1')
  .replace(/\r/g, '\\r')
  .replace(/\n/g, '\\n')
}

/**
 * 转义HTML字符
 * @param {string} string HTML字符
 * @returns {string} 结果字符串
 */
function escapeHTML (string) {
  return toString(string).replace(/&(?![\w#]+;)|[<>"']/g, function (name) {
    return escapeHTML.SOURCES[name]
  })
}

// escape sources
// 转义资源
escapeHTML.SOURCES = {
  '<' : '&lt;',
  '>' : '&gt;',
  '&' : '&amp;',
  '"' : '&quot;',
  "'" : '&#x27;',
  '/' : '&#x2f;'
}

/**
 * 获取元素在数组中所在位置的键值
 * @param {array} array 数组
 * @param {*} value 要获取键值的元素
 * @returns {integer} 键值，不存在返回 -1;
 */
function indexOf (array, value) {
  if (Array.prototype.indexOf && is('Function')(array.indexOf)) {
    return array.indexOf(value)
  }

  for (let [i, l] = [0, array.length]; i < l; i ++) {
    if (array[i] === value) {
      return i
    }
  }

  return -1
}

/**
 * inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @param {Array} array 数组
 * @param {Object|integer} query 对象或数字(数字用于数组下标)
 * @param {string} propName 属性名
 * @return {Integer} 键值，不存在返回 -1
 */
function inArrayBy (array, query, propName) {
  let index = is('Object')(query)
  ? query[propName]
  : query

  /* eslint eqeqeq: 0 */
  for (let [i, l] = [0, array.length]; i < l; i ++) {
    if (index == array[i][propName]) {
      return i
    }
  }

  return -1
}

/**
 * 遍历数组或对象
 * @param {Array|Object} collection 需要遍历的结合
 * @param {Function} callback 回调函数
 */
function forEach (collection, callback) {
  if (is('Function')(callback)) {
    if (is('Array')(collection)) {
      if (Array.prototype.some) {
        collection.some(callback)
      }
      else {
        for (let [i, l] = [0, collection.length]; i < l; i ++) {
          if (true === callback(collection[i], i)) {
            break
          }
        }
      }
    }
    else if (is('Object')(collection)) {
      for (let i in collection) {
        if (true === callback(collection[i], i)) {
          break
        }
      }
    }
  }
}

/**
 * 数组去重
 * @param {Array} array 需要去重数组
 * @return {Array} 结果数组
 */
function unique (array) {
  let [n, r] = [{}, []]

  for (let i = array.length; i --;) {
    if (!n.hasOwnProperty(array[i])) {
      r.push(array[i])
      n[array[i]] = 1
    }
  }

  return r
}

/**
 * 集合过滤
 * @param {Object|Array} collection 需要过滤的元素
 * @param {Function} callback 回调函数
 * @returns {Object|Array} 结果数据或对象
 */
function filter (collection, callback) {
  let isArr = is('Array')(collection)
  let res   = isArr ? [] : {}

  forEach(collection, function (val, key) {
    if (callback(val, key)) {
      res[isArr ? res.length : key] = val
    }
  })

  return res
}

/**
 * 合并数组或对象
 * @param {Array|Object} objectA 对象
 * @param {Array|Object} objectB 对象
 * @returns {Array|Object} objectA 第一个传入的对象
 */
function extend (...args) {
  let [paramA, paramB] = [args[0], args[1]]

  if (2 < args.length) {
    paramA = extend(paramA, paramB)

    let next = Array.prototype.slice.call(args, 2)
    return extend.apply({}, [paramA].concat(next))
  }

  if (is('Array')(paramA) && is('Array')(paramB)) {
    Array.prototype.splice.apply(paramA, [paramA.length, 0].concat(paramB))
  }
  else if (is('Object')(paramA) && is('Object')(paramB)) {
    if (is('Function')(Object.assign)) {
      paramA = Object.assign(paramA, paramB)
    }
    else {
      for (let i in paramB) {
        paramA[i] = paramB[i]
      }
    }
  }

  return paramA
}

/**
 * 抛出异常
 * @param {string|Object} error 错误异常
 * @return {string} 错误信息
 */
function __throw (error) {
  /* eslint no-console: 0 */
  let messages = []

  if (is('Object')(error)) {
    forEach(error, function (value, name) {
      messages.push(`<${name.substr(0, 1).toUpperCase()}${name.substr(1)}>`)
      messages.push('\n')
      messages.push(value)
      messages.push('\n\n')
    })
  }
  else if (is('String')(error)) {
    messages = error
  }

  try {
    console.error.apply(console, messages)
  }
  catch (err) {
    setTimeout(function () {
      throw messages
    })
  }

  return messages
}

/**
 * 伪渲染函数
 * @return {string} 空字符串
 */
function __render () {
  return ''
}