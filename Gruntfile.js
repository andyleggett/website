module.exports = function(grunt) {

	// configure the tasks
	grunt.initConfig({

		pkg: require('./package.json'),

		watch: {
			compass: {
				files: 'sass/**/*.scss',
				tasks: ['compass']//, 'autoprefixer', 'cssmin'
			},
			scripts: {
				files: ['_scripts/**/*.js'],
				tasks: ['jshint','concat','uglify']
			},
			jekyll: {
				files: ['*.html', '*.yml', '_includes/**', '_posts/**', '_layouts/**', '_templates/**', 'css/**', 'js/**'],
				tasks: ['jekyll']
			},
			livereload: {
				options: { livereload: true },
				files: [ './_site/*']
			}
		},
		connect: {
			 server: {
				options: {
					 port: 8000,
					 base: './_site/'
				}
			}
		},
		compass: {
			dist: {
				options: {
					//require: 'susy',
					sassDir: 'sass',
					cssDir: 'css',
					config: 'config.rb'
				}
			}
		},
		cssmin: {
			minify: {
			expand: true,
			cwd: 'css/',
			src: '*.css',
			dest: 'css/',
			ext: '.min.css'
			}
		},
		autoprefixer: {
			dist: {
				 options: {
					 browsers: ['last 2 version']
				},
				src: 'css/site.css',
				dest: 'css/site.css'
			}
		},
		jshint: {
			all: ['_scripts/*.js']
		},
		concat: {
			dist: {
				src: ['_scripts/libs/jquery/dist/jquery.js', '_scripts/*.js'],
				dest: 'js/app.js',
			}
		},
		uglify: {
			build: {
				src: 'js/app.js',
				dest: 'js/app.min.js'
			}
		},
		 jekyll: {
			options: {
				bundleExec: false,
				src : './'
			},
			dist: {
	  			options: {
				dest: './_site/',
				config: '_config.yml,'
	  			}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jekyll');

	grunt.registerTask('default',['connect', 'watch']);

};
