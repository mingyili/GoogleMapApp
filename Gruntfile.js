module.exports = function(grunt) {
    //配置参数
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: ['dist/'],
            base: ['dist/js/*.min.js'],
        },
        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            dist: {
                src: [
                    "src/js/data.js",
                    "src/js/app.js",
                    "src/js/map.js"
                ],
                dest: "src/js/base.js"
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/js/base.min.js': 'src/js/base.js'
                }
            }
        },
        filerev: {
            js: {
                src: 'dist/js/base.min.js',
                dest: 'dist/js/'
            }
        },
        copy: {
            lib: {
                expand: true,
                cwd: 'lib/',
                src: '**',
                dest: 'dist/js/',
            }
        },
        usemin: {
          options: {
            assetsDirs: [
              'dist',
            ]
          },
          html: 'relace.html'
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'relace.html',
                }
            }
        }
    });

    //载入
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-usemin');

    //注册任务, 清除 dist, 复制 lib, 合并js, 压缩js, hash, 清除 base, 更改调用名, 压缩 html
    grunt.registerTask('default', [ 'clean:dist', 'copy:lib', 'concat', 'uglify', 'filerev', 'clean:base', 'usemin', 'htmlmin']);
}