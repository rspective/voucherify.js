"use strict";

var gulp        = require("gulp");
var uglify      = require("gulp-uglify");
var uglifycss   = require('gulp-uglifycss');
var rename      = require("gulp-rename");
var sequence    = require('gulp-sequence');
var sourcemaps  = require('gulp-sourcemaps');

gulp.task("build-js", function() {
  return gulp.src([ "lib/voucherify.js" ])
    .pipe(gulp.dest("./dist"))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename("voucherify.min.js"))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./dist"));
});


gulp.task("build-css", function() {
  return gulp.src([ "lib/voucherify.css" ])
    .pipe(gulp.dest("./dist"))
    .pipe(sourcemaps.init())
    .pipe(uglifycss())
    .pipe(rename("voucherify.min.css"))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./dist"));
});

gulp.task("build", sequence(["build-js", "build-css"]));
