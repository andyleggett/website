var gulp = require('gulp');
var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var R = require('ramda');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var compass = require('gulp-compass');
var cleanCSS = require('gulp-clean-css');
var es = require('event-stream');
var child = require('child_process');
var sequence = require('run-sequence');
var fs = require('fs');
var path = require('path');

var config = {
  entryFiles: ['_scripts/app.js'],
  outputDirScripts: '_site/js/',
  outputDirStyles: '_site/css/',
  outputDirImages: '_site/images/'
};

var packageJson = require('./package.json');
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

var handleErrors = function(err) {
  console.log('Error: ' + err.message);
  this.emit('end');
};

var isJSFile = function(file) {
  return file.indexOf('.js') >= 0;
};

gulp.task('libs', function() {
  return browserify()
    .require(dependencies)
    .bundle()
    .on('error', handleErrors)
    .pipe(source('libs.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest(config.outputDirScripts));
});

gulp.task('scripts', function() {
  var files = fs.readdirSync('_scripts');

  var tasks = files.filter(isJSFile).map(function(entry) {
    return watchify(browserify('./_scripts/' + entry, {
        debug: true
      }))
      .external(dependencies)
      .transform(babelify)
      .bundle()
      .on('error', handleErrors)
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      //.pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.outputDirScripts))
      .pipe(reload({
        stream: true
      }));
  });
  // create a merged stream
  return es.merge.apply(null, tasks);
});

gulp.task('compass', function() {
  gulp.src('sass/*.scss')
    .pipe(compass({
      config_file: './config.rb'
    }))
    .on('error', function(err) {
      console.log(err);
    })

  .pipe(gulp.dest(config.outputDirStyles))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('jekyll-clean', function() {
  return child.spawn('jekyll', ['clean'], {
    stdio: 'inherit'
  });
});

gulp.task('jekyll-build', function() {
  return child.spawn('jekyll', ['build'], {
    stdio: 'inherit'
  }).on('close', function() {
    sequence('scripts', 'libs');
  });
});

gulp.task('watch', function() {
  browserSync({
    server: {
      baseDir: './_site/'
    }
  });

  gulp.watch('package.json', ['libs']);
  gulp.watch('_scripts/**', ['scripts']);
  gulp.watch('sass/**/*.scss', ['compass']);
  gulp.watch(['*.html', '*.yml', 'about/**/*', 'start/**/*', 'projects/**', 'work/**', 'articles/**', '_includes/**', '_posts/**', '_layouts/**', '_templates/**', '_plugins/**'], ['jekyll-build']);
});

gulp.task('default', ['jekyll-build', 'watch']);