module.exports = function(grunt) {
  'use strict'

  var path = require('path'),
      fs = require('fs'),
      _ = grunt.util._

  // Load the plugin
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-es6-transpiler');
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-karma')

  // Configure
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    es5Path: 'dist/es5/',
    es6Path: 'dist/es6/',
    srcPath: 'src/',

    clean: {
      dist: 'dist'
    },

    concat: {
      options: {
        separator: ';\n',
        banner: '~(function(root) {\'use strict\'\n',
        footer: '})(this);'
      }
    },

    es6transpiler: {
      dist: {
        dest: '<%= es5Path %>',
        cwd: '<%= es6Path %>',
        src: ['client/*.js', 'node/*.js'],
        expand: true
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    jsdoc: {
      dist: {
        options: {
          destination: 'document',
          readme: 'README.md',
          template : "node_modules/ink-docstrap/template",
          configure : "node_modules/ink-docstrap/template/jsdoc.conf.json"
        },
        src: ['src/*/*.js'],
      }
    },

    watch: {
      gruntfile: {
        options: {
          event: ['added', 'changed'],
          reload: true
        },
        files: ['Gruntfile.js'],
        tasks: ['develop']
      },
      compile: {
        files: ['src/core/*.js', 'src/syntax/*.js', 'src/vendors/*.js'],
        tasks: ['clean', 'scripts']
      }
    }
  })

  grunt.registerTask('scripts', 'find scripts to concat and uglify.', function() {
    var syntax = [],
        defaultSyntax

    grunt.file
    .expand('src/syntax/*')
    .forEach(function(file) {
      var stats     = fs.lstatSync(file),
          filename  = file.split('/').splice(-1, 1).pop(),
          ext       = path.extname(filename),
          name      = filename.replace(ext, '')

       ext === '.js' && syntax.push({
        path      : file,
        filename  : filename,
        name      : name
      })
    })

    var defaultIndex = _.pluck(syntax, 'name').indexOf('default')
    defaultSyntax = syntax.splice(defaultIndex !== -1 ? defaultIndex : 0, 1).pop()

    grunt.file
    .expand('src/vendors/*')
    .forEach(function(file) {
      var stats     = fs.lstatSync(file),
          filename  = file.split('/').splice(-1, 1).pop(),
          ext       = path.extname(filename),
          name      = filename.replace(ext, '')

      if (ext === '.js') {
        // Lit version
        grunt.config('concat.' + name + '@lite', {
          dest: '<%= es6Path %>' + name + '/<%= pkg.name %>.lite.js',
          src: [
            'src/core/conf.js',
            'src/core/main.js',
            file,
            'src/core/utilities.js',
            'src/core/export.js'
          ]
        })

        grunt.config('uglify.' + name + '@lite', {
          options: {
            banner: '// <%= pkg.name %>.lite.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
          },
          dest: '<%= es5Path %>' + name + '/<%= pkg.name %>.lite.min.js',
          src: '<%= es5Path %>' + name + '/<%= pkg.name %>.lite.js'
        })

        // Default syntax version
        if (defaultSyntax) {
          grunt.config('concat.' + name + '@syntax', {
            dest: '<%= es6Path %>' + name + '/<%= pkg.name %>.js',
            src: [
              'src/core/conf.js',
              'src/core/main.js',
              'src/core/syntax.js',
              defaultSyntax.path,
              file,
              'src/core/utilities.js',
              'src/core/export.js'
            ]
          })

          grunt.config('uglify.' + name + '@syntax', {
            options: {
              banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
            },
            dest: '<%= es5Path %>' + name + '/<%= pkg.name %>.min.js',
            src: '<%= es5Path %>' + name + '/<%= pkg.name %>.js'
          })
        }

        // Ohter syntax version
        if (syntax.length > 0) {
          syntax.forEach(function(syntax) {
            grunt.config('concat.' + name + '@syntax-' + syntax.name, {
              dest: '<%= es6Path %>' + name + '/<%= pkg.name %>.' + syntax.name + '.js',
              src: [
                'src/main.js',
                'src/syntax.js',
                syntax.path,
                file,
                'src/utilities.js',
                'src/export.js'
              ]
            })

            grunt.config('uglify.' + name + '@syntax-' + syntax.name, {
              options: {
                banner: '// <%= pkg.name %>.' + syntax.name + '.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
              },
              dest: '<%= es5Path %>' + name + '/<%= pkg.name %>.' + syntax.name + '.min.js',
              src: '<%= es5Path %>' + name + '/<%= pkg.name %>.' + syntax.name + '.js'
            })
          })
        }
      }
    })

    grunt.task.run(['concat', 'es6transpiler', 'uglify'])
  })

  grunt.registerTask('develop', ['clean', 'scripts', 'watch'])
  grunt.registerTask('release', ['clean', 'scripts', 'karma'])
  grunt.registerTask('default', ['release'])
}