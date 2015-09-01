module.exports = function(config) {
  config.set({
    files: [
      'dist/oTemplate.js',
      'tests/oTemplate.spec.js'
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