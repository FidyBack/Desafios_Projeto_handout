var del = require('del');
var gulp = require('gulp');
var cache = require('gulp-cached');
var handout = require('./handout');

const ASSETS = ['resources/**/css/*', 'resources/**/icons/*', 'resources/**/js/*'];
const STATIC = ['src/**/*', '!src/**/*.md'];
const SOURCES = ['src/**/*.md'];
const TEMPLATE = 'resources/template.html';

clean = function() {
  return del(['site/*']);
};

copyAssets = function() {
  return gulp.src(ASSETS)
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'));
};

copyStatic = function() {
  return gulp.src(STATIC)
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'));
};

runHandout = function() {
  return gulp.src(SOURCES)
    .pipe(cache('handouting'))
    .pipe(handout(TEMPLATE))
    .pipe(gulp.dest('site'));
};

watch = function() {
  gulp.watch(ASSETS, copyAssets);
  gulp.watch(STATIC, copyStatic);
  gulp.watch(SOURCES, runHandout);
  gulp.watch(TEMPLATE, runHandout);
};

gulp.task('clean', clean)
gulp.task('default', gulp.series(gulp.parallel(copyAssets, copyStatic, runHandout), watch));
