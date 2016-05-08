'use strict'

module.exports = function (config) {
  config.set({
    files: [
      'node_modules/jasmine-ajax/lib/mock-ajax.js',
      'dist/es5/client/oTemplate.js',
      'tests/*.spec.js',
    ],
    autoWatch   : false,
    singleRun   : true,
    frameworks  : ['jasmine'],
    browsers    : ['PhantomJS'],
    plugins     : [
      'karma-jasmine',
      'karma-phantomjs-launcher',
    ],
  })
}