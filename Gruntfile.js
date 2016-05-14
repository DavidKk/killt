'use strict'

import path from 'path';
import fs   from 'fs';

export default (grunt) => {
  const _ = grunt.util._

  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-babel')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-eslint')
  grunt.loadNpmTasks('grunt-karma')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    es5Path: 'dist/es5/',
    es6Path: 'dist/es6/',
    srcPath: 'src/',

    clean: {
      dist: 'dist',
    },

    concat: {
      options: {
        banner: `~((root = {}) => {\n'use strict'\n`,
        footer: `\n})('undefined' === typeof global ? 'undefined' === typeof window ? {} : window : global)`,
      },
    },

    babel: {
      options: {
        presets: ['es2015'],
        plugins: ['transform-class-properties'],
      },
      es5: {
        dest: '<%= es5Path %>',
        cwd: '<%= es6Path %>',
        src: ['*/*.js'],
        expand: true,
      },
    },

    uglify: {
      options: {
        sourceMap: true,
        banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>',
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

    eslint: {
      options: {
        configFile: '.eslintrc',
      },
      dest: [
        'dist/es6/client/killt.js',
        'dist/es6/server/killt.js',
      ],
    },

    karma: {
      unitest: {
        configFile: 'karma.conf.js',
      },
    },

    watch: {
      gruntfile: {
        options: {
          event: ['added', 'changed'],
          reload: true,
        },
        files: ['Gruntfile.js'],
        tasks: ['develop'],
      },
      compile: {
        files: ['src/core/*.js', 'src/syntax/*.js', 'src/vendors/*.js'],
        tasks: ['clean', 'scripts'],
      },
    },
  })

  grunt.registerTask('scripts', 'find scripts to concat and uglify.', function() {
    let syntax = []
    let defaultSyntax

    grunt.file
    .expand('src/syntax/*')
    .forEach((file) => {
      let stats     = fs.lstatSync(file)
      let filename  = file.split('/').splice(-1, 1).pop()
      let ext       = path.extname(filename)
      let name      = filename.replace(ext, '')

       ext === '.js' && syntax.push({
        path      : file,
        filename  : filename,
        name      : name,
      })
    })

    grunt.file
    .expand('src/vendors/*')
    .forEach((filePath) => {
      let stats       = fs.lstatSync(filePath)
      let filename    = filePath.split('/').splice(-1, 1).pop()
      let ext         = path.extname(filename)
      let vendorName  = filename.replace(ext, '')

      grunt.config(`concat.${vendorName}@lit`, {
        dest: `<%= es6Path %>${vendorName}/<%= pkg.name %>.lit.js`,
        src: [
          'src/core/utilities.js',
          'src/core/conf.js',
          'src/core/engine.js',
          'src/core/syntax.js',
          filePath,
        ]
      })

      if (ext === '.js' && syntax.length > 0) {
        syntax.forEach(function(syntax) {
          let syntaxName  = syntax.name
          let taskName    = `${vendorName}@syntax-${syntaxName}`
          let fileName    = `<%= pkg.name %>${'default' === syntaxName ? '' : ('.' + syntaxName)}`

          grunt.config(`concat.${taskName}`, {
            dest: `<%= es6Path %>${vendorName}/${fileName}.js`,
            src: [
              'src/core/utilities.js',
              'src/core/conf.js',
              'src/core/engine.js',
              'src/core/syntax.js',
              syntax.path,
              filePath,
            ]
          })
        })
      }
    })

    grunt.task.run(['concat', 'babel', 'uglify'])
  })

  grunt.registerTask('develop', ['clean', 'scripts', 'watch'])
  grunt.registerTask('release', ['clean', 'scripts', 'unitest'])
  grunt.registerTask('unitest', ['eslint', 'karma'])
  grunt.registerTask('default', ['release'])
}