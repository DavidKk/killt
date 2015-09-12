module.exports = function(grunt) {
  'use strict'

  var path = require('path'),
      fs = require('fs'),
      _ = grunt.util._

  // Load the plugin
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-karma')

  // Configure
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
        files: ['src/*.js', 'syntax/*.js'],
        tasks: ['clean', 'scripts']
      }
    }
  })

  grunt.registerTask('scripts', 'find scripts to concat and uglify.', function() {
    var syntax = [],
        defaultSyntax

    grunt.file
    .expand('syntax/*')
    .forEach(function(file) {
      var stats = fs.lstatSync(file),
          filename = file.split('/').splice(-1, 1).pop(),
          ext = path.extname(filename),
          name = filename.replace(ext, '')

       ext === '.js' && syntax.push({
        path: file,
        filename: filename,
        name: name
      })
    })

    var defaultIndex = _.pluck(syntax, 'name').indexOf('default')
    defaultSyntax = syntax.splice(defaultIndex !== -1 ? defaultIndex : 0, 1).pop()

    grunt.file
    .expand('vendors/*')
    .forEach(function(file) {
      var stats = fs.lstatSync(file),
          filename = file.split('/').splice(-1, 1).pop(),
          ext = path.extname(filename),
          name = filename.replace(ext, '')

      if (ext === '.js') {
        // Lit version
        grunt.config('concat.' + name + '@lite', {
          dest: 'dist/' + name + '/<%= pkg.name %>.lite.js',
          src: [
            'src/main.js',
            file,
            'src/utilities.js',
            'src/export.js'
          ]
        })

        grunt.config('uglify.' + name + '@lite', {
          options: {
            banner: '// <%= pkg.name %>.lite.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
          },
          dest: 'dist/' + name + '/<%= pkg.name %>.lite.min.js',
          src: 'dist/' + name + '/<%= pkg.name %>.lite.js'
        })

        // Default syntax version
        if (defaultSyntax) {
          grunt.config('concat.' + name + '@syntax', {
            dest: 'dist/' + name + '/<%= pkg.name %>.js',
            src: [
              'src/main.js',
              'src/syntax.js',
              defaultSyntax.path,
              file,
              'src/utilities.js',
              'src/export.js'
            ]
          })

          grunt.config('uglify.' + name + '@syntax', {
            options: {
              banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
            },
            dest: 'dist/' + name + '/<%= pkg.name %>.min.js',
            src: 'dist/' + name + '/<%= pkg.name %>.js'
          })
        }

        // Ohter syntax version
        if (syntax.length > 0) {
          syntax.forEach(function(syntax) {
            grunt.config('concat.' + name + '@syntax-' + syntax.name, {
              dest: 'dist/' + name + '/<%= pkg.name %>.' + syntax.name + '.js',
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
              dest: 'dist/' + name + '/<%= pkg.name %>.' + syntax.name + '.min.js',
              src: 'dist/' + name + '/<%= pkg.name %>.' + syntax.name + '.js'
            })
          })
        }
      }
    })

    grunt.task.run(['concat', 'uglify'])
  })

  grunt.registerTask('develop', ['clean', 'scripts', 'watch'])
  grunt.registerTask('release', ['clean', 'scripts', 'karma'])
  grunt.registerTask('default', ['release'])
}