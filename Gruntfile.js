module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-less');

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
        }
    });

    grunt.registerTask('default', ['less']);
};
