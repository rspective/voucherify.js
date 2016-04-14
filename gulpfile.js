"use strict";

var gulp        = require("gulp");
var uglify      = require("gulp-uglify");
var uglifycss   = require('gulp-uglifycss');
var rename      = require("gulp-rename");
var sequence    = require('gulp-sequence')

gulp.task("build-js", function() {
  return gulp.src([ "lib/voucherify.js" ])
    .pipe(gulp.dest("./dist"))
    .pipe(uglify())
    .pipe(rename("voucherify.min.js"))
    .pipe(gulp.dest("./dist"));
});


gulp.task("build-css", function() {
  return gulp.src([ "lib/voucherify.css" ])
    .pipe(gulp.dest("./dist"))
    .pipe(uglifycss())
    .pipe(rename("voucherify.min.css"))
    .pipe(gulp.dest("./dist"));
});

gulp.task("build", sequence(["build-js", "build-css"]));
