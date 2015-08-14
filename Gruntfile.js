module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.initConfig({

        less: {
            pong: {
                files: {
                    'public/styles/style.css': [
                        'app/components/base.less',
                        'app/**/*.less',
                        '!**/vars.less'
                    ]
                },
                options: {
                    compress: false,
                    paths: ['app/components']
                }
            }
        },

        ngtemplates: {
            options: {
                url: function(path) {
                    return path.replace('app/components/', 'views/');
                },
                bootstrap: function(module, script) {
                    return 'pongApp.run(function($templateCache){' + script + '});';
                },
                htmlmin: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeComments: true,
                    removeEmptyAttributes: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                }
            },
            pong: {
                src: 'app/components/**/*.html',
                dest: 'app/components/views.js'
            }
        },

        copy: {
            index: {
                src: 'app/index.html',
                dest: 'public/index.html'
            },
            images: {
                expand: true,
                cwd: 'app/images/',
                src: '**/*',
                dest: 'public/images/'
            }
        },

        clean: {
            pong: ['public']
        },

        concat: {
            options: {
                separator: ';'
            },
            pong: {
                src: [
                    'app/app.prefix',
                    'app/app.js',
                    'app/common/**/*.js',
                    'app/components/**/*.js',
                    'app/app.suffix'
                ],
                dest: 'public/scripts/app.js'
            }
        },

        watch: {
            styles: {
                files: 'app/components/**/*.less',
                tasks: 'less'
            },
            scripts: {
                files: [
                    'app/app.js',
                    'app/app.prefix',
                    'app/app.suffix',
                    'app/common/**/*.js',
                    'app/components/**/*.js',
                ],
                tasks: 'concat'
            },
            templates: {
                files: 'app/components/**/*.html',
                tasks: 'ngtemplates'
            },
            index: {
                files: 'app/index.html',
                tasks: 'copy:index'
            },
            images: {
                files: 'app/images/**',
                tasks: 'copy:images'
            }
        }

    });

    grunt.registerTask('default', ['clean', 'copy', 'less', 'ngtemplates', 'concat']);

    grunt.registerTask('reload-clients', 'Reload currently running web apps', function() {
        var donzo = this.async(),
            request = require('request');

        request({
            method: 'post',
            url: 'https://pdxpong.firebaseio.com/relay/events.json?print=silent',
            json: true,
            body: {
                id: null,
                ev: 'client.reload',
                ts: {
                    '.sv': 'timestamp'
                }
            }
        }, donzo);
    });
};
