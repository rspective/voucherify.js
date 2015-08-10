"use strict";

var util = require("util");

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

var config = require("./package.json");

gulp.task("build", function() {
  var prefix = util.format("voucherify-%s", config.version);

  return gulp.src([ "lib/voucherify.js" ])
    .pipe(rename(prefix + ".js"))
    .pipe(gulp.dest("./dist"))
    .pipe(uglify())
    .pipe(rename(prefix + ".min.js"))
    .pipe(gulp.dest("./dist"));
});
