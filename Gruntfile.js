module.exports = function(grunt) {
  'use strict'

  // Load the plugin
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-karma')

  // Configuring
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dist: 'dist'
    },

    concat: {
      options: {
        separator: ';\n',
        banner: '~(function(root) {\'use strict\';\n',
        footer: '})(this);'
      },
      lite: {
        src: [
          'src/main.js',
          'src/export.js',
          'src/utilities.js'
        ],
        dest: 'dist/<%= pkg.name %>.lite.js'
      },
      full: {
        src: [
          'src/main.js',
          'src/syntax.js',
          'src/export.js',
          'src/utilities.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - '
          + '<%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
      },
      lite: {
        src: ['<%= concat.lite.dest %>'],
        dest: 'dist/<%= pkg.name %>.lite.min.js'
      },
      full: {
        src: ['<%= concat.full.dest %>'],
        dest: 'dist/<%= pkg.name %>.min.js'
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
        files: ['src/*.js'],
        tasks: ['concat', 'uglify']
      }
    }
  })

  grunt.registerTask('develop', ['concat', 'uglify', 'watch'])
  grunt.registerTask('release', ['clean', 'concat', 'uglify', 'karma'])
  grunt.registerTask('default', ['develop'])
}