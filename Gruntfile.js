module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        less: {
            pong: {
                files: {
                    'public/styles/style.css': 'public/styles/style.less'
                },
                options: {
                    compress: false,
                    paths: ['public/styles']
                }
            }
        },
        watch: {
            styles: {
                files: ['public/**/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.registerTask('default', ['less']);
};
