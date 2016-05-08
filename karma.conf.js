'use strict'

export default function (config) {
  config.set({
    babelPreprocessor: {
      options: {
        presets: ['es2015'],
        plugins: ['transform-class-properties'],
      },
    },
    autoWatch   : false,
    singleRun   : true,
    frameworks  : ['jasmine'],
    browsers    : ['PhantomJS'],
    plugins     : [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-babel-preprocessor',
    ],
    files: [
      'node_modules/jasmine-ajax/lib/mock-ajax.js',
      'src/core/root.js',
      'src/core/utilities.js',
      'src/core/conf.js',
      'src/core/engine.js',
      'src/core/syntax.js',
      'src/syntax/default.js',
      'src/vendors/client.js',
      'tests/*.spec.js',
    ],
    preprocessors: {
      'src/**/*.js'           : ['babel'],
      'tests/**/*.spec.js'    : ['babel'],
    },
  })
}