/**
 * current envirment - 配置环境
 * @type {Object}
 */
const ENV = {
  /** production env - 生产环境 */
  PRODUCE : 1,
  /** develop env - 开发环境 */
  DEVELOP : 2,
  /** unit test env - 单元测试环境 */
  UNITEST : 3,
}

/**
 * default options - 默认配置
 * @type {Object}
 */
const DEFAULTS = {
  /** current entironment - 当前环境 [unit, develop, produce] */
  env       : ENV.PRODUCE,
  /** is use native syntax - 是否使用使用原生语法 */
  noSyntax  : true,
  /** compile syntax in strict mode - 是否通过严格模式编译语法 */
  strict    : true,
  /** escape the HTML - 是否编码输出变量的 HTML 字符 */
  escape    : true,
  /** compress the html code - 压缩生成的HTML代码 */
  compress  : true,
  /** addition render arguments (must be use `$` to define variable name) - 追加渲染器的传值设定,默认拥有 $data (必须使用 `$` 作为起始字符来定义变量) */
  depends   : [],
}