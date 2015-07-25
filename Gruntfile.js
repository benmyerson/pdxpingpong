module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        less: {
            pong: {
                files: {
                    'public/styles/style.css': [
                        'public/views/base.less',
                        'public/views/**/*.less',
                        '!**/vars.less'
                    ]
                },
                options: {
                    compress: false,
                    paths: ['public/views']
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
