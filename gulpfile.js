"use strict";

var util        = require("util");
var gulp        = require("gulp");
var uglify      = require("gulp-uglify");
var uglifycss   = require('gulp-uglifycss');
var rename      = require("gulp-rename");
var sequence    = require('gulp-sequence')
var config      = require("./package.json");

gulp.task("build-js", function() {
  var prefix = util.format("voucherify-%s", config.version);

  return gulp.src([ "lib/voucherify.js" ])
    .pipe(rename(prefix + ".js"))
    .pipe(gulp.dest("./dist"))
    .pipe(uglify())
    .pipe(rename(prefix + ".min.js"))
    .pipe(gulp.dest("./dist"));
});


gulp.task("build-css", function() {
  var prefix = util.format("voucherify-%s", config.version);

  return gulp.src([ "lib/voucherify.css" ])
    .pipe(rename(prefix + ".css"))
    .pipe(gulp.dest("./dist"))
    .pipe(uglifycss())
    .pipe(rename(prefix + ".min.css"))
    .pipe(gulp.dest("./dist"));
});

gulp.task("build", sequence(["build-js", "build-css"]));
