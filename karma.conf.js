'use strict'

export default function (config) {
  config.set({
    frameworks : ['jasmine'],
    browsers   : ['PhantomJS'],
    files      : [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/jasmine-ajax/lib/mock-ajax.js',
      'tests/utilities/root.js',

      'src/core/utilities.js',
      'src/core/conf.js',
      'src/core/engine.js',
      'src/core/syntax.js',
      'src/syntax/default.js',
      'src/vendors/client.js',

      'tests/*.spec.js',
    ],
    reporters: [
      'progress',
      'coverage',
    ],
    babelPreprocessor: {
      options: {
        presets : ['es2015'],
        plugins : ['transform-class-properties'],
      },
    },
    preprocessors: {
      'src/**/*.js'        : ['babel', 'coverage'],
      'tests/**/*.spec.js' : ['babel', 'coverage'],
    },
    coverageReporter: {
      type  : 'lcov',
      dir   : 'coverage/',
      subdir (browser) {
        return browser.toLowerCase().split(/[ /-]/)[0];
      },
    },
    autoWatch : false,
    singleRun : true,
    plugins   : [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-babel-preprocessor',
      'karma-coverage',
    ],
  })
}