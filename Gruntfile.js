module.exports = function(grunt) {
  'use strict'

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
      },
      lite: {
        src: [
          'src/main.js',
          'src/export.js',
          'src/utilities.js',
          'src/client.js'
        ],
        dest: 'dist/<%= pkg.name %>.lite.js'
      },
      full: {
        src: [
          'src/main.js',
          'src/syntax.js',
          'syntax/default.js',
          'src/export.js',
          'src/utilities.js',
          'src/client.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      liteServer: {
        src: [
          'src/main.js',
          'src/export.js',
          'src/utilities.js',
          'src/server.js'
        ],
        dest: 'dist/<%= pkg.name %>.lite.server.js'
      },
      fullServer: {
        src: [
          'src/main.js',
          'src/syntax.js',
          'syntax/default.js',
          'src/export.js',
          'src/utilities.js',
          'src/server.js'
        ],
        dest: 'dist/<%= pkg.name %>.server.js'
      },
    },

    uglify: {
      options: {
        sourceMap: true,
        banner: '// <%= pkg.name %>.min.js#<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>'
      },
      dist: {
        dest: 'dist/',
        cwd: 'dist/',
        src: ['*.js', '!*.server.js'],
        expand: true,
        extDot: 'last',
        ext: '.min.js'
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
        tasks: ['clean', 'concat', 'uglify']
      }
    }
  })

  grunt.registerTask('develop', ['clean', 'concat', 'uglify', 'watch'])
  grunt.registerTask('release', ['clean', 'concat', 'uglify', 'karma'])
  grunt.registerTask('default', ['develop'])
}