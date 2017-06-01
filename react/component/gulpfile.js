'use strict';
var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');
var babel = require('gulp-babel');
var del = require('del');
var path = require('path');
var excludeGitignore = require('gulp-exclude-gitignore');
var eslint = require('gulp-eslint');
var eslintIfFixed = require('gulp-eslint-if-fixed');
var webpack = require('webpack-stream');
var lodashWebpackPlugin = require('lodash-webpack-plugin');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var Server = require('karma').Server;

gulp.task('lint:src', () => {
  return gulp.src('src/*.jsx')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslintIfFixed('src'))
    .pipe(eslint.failAfterError());
});

gulp.task('lint:test', () => {
  return gulp.src('test/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslintIfFixed('test'))
    .pipe(eslint.failAfterError());
});

gulp.task('babel', () => {
  return gulp.src('src/at-react-component.jsx')
    .pipe(plumber())
    .pipe(babel({
      plugins: ['lodash'],
      presets: ['es2015', 'react'],
      compact: false
    }))
    .pipe(gulp.dest('src'));
});

gulp.task('pack', () => {
  return gulp.src('src/at-react-component.js')
    .pipe(plumber())
    .pipe(webpack({
      output: {
        filename: 'at-react-component.js',
        libraryTarget: 'umd'
      },
      plugins: [
        new lodashWebpackPlugin
      ]
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('test:run', done => {
  new Server({
    configFile: path.join(__dirname, '/karma.conf.js')
  }, done).start();
});

gulp.task('test:debug', done => {
  new Server({
    configFile: path.join(__dirname, '/karma.conf.js'),
    singleRun: false,
    browsers: ['Chrome'],
    reporters: ['kjhtml']
  }, done).start();
});

gulp.task('clean', () => {
  return del(['dist/**/*']);
});

gulp.task('build:dist', () => {
  return gulp.src([
      'src/header.js',
      'src/at-react-component.js'
    ])
    .pipe(plumber())
    .pipe(concat('at-react-component.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify({
      preserveComments: 'license'
    }))
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.{js,jsx}', ['lint:src', 'babel', 'test:run']);
  gulp.watch('test/**/*.js', ['lint:test', 'test:run']);
});

gulp.task('lint', ['lint:src', 'lint:test']);

gulp.task('test', gulpSequence('lint', 'babel', 'pack'));

gulp.task('build', gulpSequence('clean', 'test', 'build:dist'));

gulp.task('default', ['test']);
