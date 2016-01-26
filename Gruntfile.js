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
      es5: {
        dest: '<%= es5Path %>',
        cwd: '<%= es6Path %>',
        src: ['*/*.js'],
        expand: true
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
      },
      clientES5: {
        dest: '<%= es5Path %>/client/',
        cwd: '<%= es5Path %>/client/',
        src: ['*.js'],
        ext: '.min.js',
        extDot: 'last',
        expand: true,
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

    grunt.file
    .expand('src/vendors/*')
    .forEach(function(filePath) {
      var stats       = fs.lstatSync(filePath),
          filename    = filePath.split('/').splice(-1, 1).pop(),
          ext         = path.extname(filename),
          vendorName  = filename.replace(ext, '')

      grunt.config('concat.' + vendorName + '@lit', {
        dest: '<%= es6Path %>' + vendorName + '/<%= pkg.name %>.lit.js',
        src: [
          'src/core/conf.js',
          'src/core/bone.js',
          'src/core/syntax.js',
          filePath,
          'src/core/utilities.js'
        ]
      })

      if (ext === '.js' && syntax.length > 0) {
        syntax.forEach(function(syntax) {
          var syntaxName  = syntax.name,
              taskName    = vendorName + '@syntax-' + syntaxName,
              fileName    = '<%= pkg.name %>' + ('default' === syntaxName ? '' : ('.' + syntaxName))

          grunt.config('concat.' + taskName, {
            dest: '<%= es6Path %>' + vendorName + '/' + fileName + '.js',
            src: [
              'src/core/conf.js',
              'src/core/bone.js',
              'src/core/syntax.js',
              syntax.path,
              filePath,
              'src/core/utilities.js'
            ]
          })
        })
      }
    })

    grunt.task.run(['concat', 'es6transpiler', 'uglify'])
  })

  grunt.registerTask('develop', ['clean', 'scripts', 'watch'])
  grunt.registerTask('release', ['clean', 'scripts', 'karma'])
  grunt.registerTask('default', ['release'])
}