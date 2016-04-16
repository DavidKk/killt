/**
 * 判断类型
 * @typedef {isType}
 * @function
 * @param {*} value 需要判断的值
 * @returns {boolean}
 */

/**
 * 判断对象是否为 type 类型
 * @function
 * @param {string} type
 * @return {isType}
 */
function is (type: string): Function {
  return function (value: any): boolean {
    switch (type) {
      case 'Undefined':
        return 'undefined' === typeof value

      case 'Defined':
        return 'undefined' !== typeof value

      case 'Integer':
        let y: number = parseInt(value, 10)
        return !isNaN(y) && value === y && value.toString() === y.toString()

      case 'PlainObject':
        let ctor: Function, prot: Object

        if (false === is('Object')(value) || is('Undefined')(value)) {
            return false
        }

        ctor = value.constructor
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

      default:
        return `[object ${type}]` === Object.prototype.toString.call(value)
    }
  }
}

/**
 * 获取所在行
 * @function
 * @param {string} content 需要查找的值
 * @param {number} position 编译
 * @returns {number}
 */
function inline (content: string, position: number): number {
  return (content.substr(0, position).match(/\n/g) || []).length +1
}

/**
 * 去除空格
 * @function
 * @param {string} content
 * @return {string}
 */
function trim (content: string): string {
  return toString(content).replace(/^\s+|\s+$/, '')
}

/**
 * 查找对象中的属性
 * @function
 * @param {Object} object 获取的对象
 * @param {string} path 查找路径
 * @param {string} spliter 分隔符 (默认为 `.`)
 * @returns {*} 若不存在返回 undefined，若存在则返回该指向的值
 * @example
 * {a:{a:{a:{a:1}}}} -> get('a.a.a.a') -> 1
 * {a:1}             -> get('a.a.a.a') -> undefined
 */
function get (object: Object, path: string, spliter: string = '.'): any {
  if (!is('String')(path)) {
    return undefined
  }
  
  let re: Object          = object
  let ns: Array<string>   = path.split(spliter)

  for (let i: number = 0, l: number = ns.length; i < l; i ++) {
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
 * @param {*} anything 传入的值
 * @returns {string}
 */
function toString (anything: any): string {
  if (is('String')(anything)) {
    return anything
  }

  if (is('Number')(anything)) {
    return anything += ''
  }

  if (is('Function')(anything)) {
    return toString(anything.call(anything))
  }

  return ''
}

/**
 * 转义标点符号
 * @function
 * @param {string} content 需要转义的字符串
 * @returns {string}
 */
function escapeSymbol (content: string = '') {
  return content
    .replace(/("|'|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

/**
 * 转义HTML字符
 * @function
 * @param {string} content HTML字符
 * @returns {string}
 */
function escapeHTML (content: string): string {
  // escape sources
  // 转义资源
  let SOURCES: Object = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2f;'
  }

  return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, (name: string) => {
    return SOURCES[name]
  })
}

/**
 * 获取元素在数组中所在位置的键值
 * @function
 * @param {array} array 数组
 * @param {*} value 要获取键值的元素
 * @returns {integer} 键值，不存在返回 -1;
 */
function indexOf (collection: Array<any>, value: any): number {
  if (Array.prototype.indexOf && is('Function')(collection.indexOf)) {
    return collection.indexOf(value)
  }
  else {
    for (let i: number = 0, l: number = collection.length; i < l; i ++) {
      if (collection[i] === value) {
        return i
      }
    }

    return -1
  }
}

/**
 * inArray 增强版，获取数组中元素拥有与要查询元素相同的属性值的键值
 * @function
 * @param {Object|integer} query 对象或数字(数字用于数组下标)
 * @return {Integer}                  键值，不存在返回 -1;
 */
function inArrayBy (collection: Array<any>, query: any, propName: string): number {
  let index: number = is('Object')(query)
    ? query[propName]
    : query

  for (let i: number = 0, l: number = collection.length; i < l; i ++) {
    if (index == collection[i][propName]) {
      return i
    }
  }

  return -1
}

/**
 * 遍历数组或对象
 * @function
 * @param {Array|Object} collection 需要遍历的结合
 * @param {Function} callback 回调函数
 */
function forEach (collection: any, callback: Function = new Function) {
  if (is('Function')(callback)) {
    if (is('Array')(collection)) {
      if (Array.prototype.some) {
        collection.some(callback)
      }
      else {
        for (let i: number = 0, l: number = collection.length; i < l; i ++) {
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
 * @function
 * @param {Array} array 需要去重数组
 * @return {Array}
 */
function unique (collection: Array<any>): Array<any> {
  let n: Object     = {}
  let r: Array<any> = [] 

  for (let i: number = collection.length; i --;) {
    if (!n.hasOwnProperty(collection[i])) {
      r.push(collection[i])
      n[collection[i]] = 1
    }
  }

  return r
}

/**
 * 集合过滤
 * @function
 * @param {Object|Array} collection 需要过滤的元素
 * @param {Function} callback 回调函数
 * @returns {Object|Array}
 */
function filter (collection: any, callback: Function = new Function): any {
  let isArr : boolean = is('Array')(collection)
  let res   : any     = isArr ? [] : {}

  forEach(collection, (val: any, key: string) => {
    if (callback(val, key)) {
      res[isArr ? res.length : key] = val
    }
  })

  return res
}

/**
 * 合并数组或对象
 * @function
 * @param {Array|Object} objectA 对象
 * @param {Array|Object} objectB 对象
 * @param {Array|Object} ... 对象
 * @returns {Array|Object} objectA 第一个传入的对象
 */
function extend (...args): any {
  let paramA: any = args[0]
  let paramB: any = args[1]

  if (args.length > 2) {
    paramA = extend(paramA, paramB)

    let next: any = Array.prototype.slice.call(args, 2)
    return extend.apply({}, [paramA].concat(next))
  }

  if (is('Array')(paramA) && is('Array')(paramB)) {
    Array.prototype.splice.apply(paramA, [paramA.length, 0].concat(paramB))
  }
  else if (is('Object')(paramA) && is('Object')(paramB)) {
    if (is('Function')(Object.assign)) {
      paramA = Object.assign(paramA, paramB);
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
 * @function
 * @param {string|Object} error 错误异常
 */
function __throw (error) {
  let messages: Array<any> = []

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
 * @function
 * @return {string} 空字符串
 */
function __render (): string {
  return ''
}