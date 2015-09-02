module.exports = function(config) {
  config.set({
    files: [
      'node_modules/jasmine-ajax/lib/mock-ajax.js',
      'dist/oTemplate.js',
      'tests/client.spec.js'
    ],
    autoWatch: false,
    singleRun: true,
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher'
    ]
  })
}