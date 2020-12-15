'use strict';

// Load plugins
var gulp               = require('gulp'),

    // Utility plugins
    util               = require('gulp-util'),
    del                = require('del'),
    //    merge        = require('merge-stream'),
    plumber            = require('gulp-plumber'),
    notify             = require('gulp-notify'),
    //    path         = require('path'),
    sourcemaps         = require('gulp-sourcemaps'),
    browserSync        = require('browser-sync'),
    fs                 = require('fs'),
    historyApiFallback = require('connect-history-api-fallback'),

    // HTML plugins
    htmlmin            = require('gulp-htmlmin'),
    inlineSource       = require('gulp-inline-source'),
    RevAll             = require('gulp-rev-all'),
    html5lint          = require('gulp-html5-lint'),

    // CSS plugins
    sass               = require('gulp-sass'),
    nano               = require('gulp-cssnano'),
    autoprefixer       = require('gulp-autoprefixer'),
    scsslint           = require('gulp-scss-lint'),

    // JS plugins
    //    uglify       = require('gulp-uglify'),
    //    concat       = require('gulp-concat'),
    eslint             = require('gulp-eslint'),
    tslint             = require('gulp-tslint'),
    ts                 = require('gulp-typescript'),

    // Image plugins
    imagemin           = require('gulp-imagemin'),
    svgSprite          = require('gulp-svg-sprite');

// Allows gulp --dist to be run for production compilation
var isProduction = util.env.dist;

var onError = notify.onError('Error: <%= error.message %>');

// Base paths
var basePaths = {
  vendor : './node_modules/',
  src    : './src/',
  test   : './test/',
  release: './release/',
};

// paths definitions
var srcFiles = {
  scss    : [
    '**/*.scss',
  ],
  js      : [
    'src/js/elevator.js',
    'node_modules/jquery/dist/jquery.js',
    'node_modules/card/lib/js/card.js',

    'node_modules/es6-shim/es6-shim.min.js',
    'node_modules/zone.js/dist/zone.js',
    'node_modules/reflect-metadata/Reflect.js',
    'node_modules/systemjs/dist/system.src.js',

    'src/js/systemjs.config.js',
  ],
  node_modules: [
    'node_modules/rxjs/**/*',
    'node_modules/angular2-in-memory-web-api/**/*',
    'node_modules/@angular/**/*',
  ],
  ts      : [
    '**/*.ts',
  ],
  img     : [
    'img/**',
  ],
  sprite  : [
    'sprite/*.svg',
  ],
  html    : [
    '**/*.html',
  ],
  semantic: [
    'semantic/dist/**',
  ],
  misc    : [
    'audio/**/*.mp3',
  ]
};

gulp.task('misc', function () {
  return gulp.src(srcFiles.misc, {
      cwd : basePaths.src,
      base: basePaths.src,
    })
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(basePaths.test));
});

gulp.task('clean', function (cb) {
  del([
    basePaths.test,
    basePaths.release,
  ], cb);
});

gulp.task('scsslint', function () {
  return gulp.src(srcFiles.scss, {cwd: basePaths.src})
    .pipe(scsslint())
    .pipe(scsslint.failReporter());
});

gulp.task('scss', ['scsslint'], function () {
  return gulp.src(srcFiles.scss, {cwd: basePaths.src, base: basePaths.src})
    .pipe(plumber({errorHandler: onError}))
    .pipe(isProduction ? util.noop() : sourcemaps.init())
    .pipe(sass({
      includePaths: [basePaths.vendor],
      outputStyle : 'compressed',
    }))
    .pipe(nano({
      discardComments: {removeAll: true},
      discardUnused  : {fontFace: false},
      zindex         : false,
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'ie >= 10'],
      cascade : false,
    }))
    .pipe(isProduction ? util.noop() : sourcemaps.write('.'))
    .pipe(gulp.dest(basePaths.test))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('eslint', function () {
  return gulp.src([
      'gulpfile.js',
      basePaths.src + '**.js',
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('js', function () {
  return gulp.src(srcFiles.js)
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(basePaths.test + 'js'));
});

gulp.task('node_modules', function () {
  return gulp.src(srcFiles.node_modules, {base: 'node_modules'})
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(basePaths.test + 'js'));
});

gulp.task('tslint', function () {
  return gulp.src(srcFiles.ts, {cwd: basePaths.src})
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('ts', ['tslint'], function () {
  var tsProject = ts.createProject('./tsconfig.json');
  var tsResult = tsProject.src() // instead of gulp.src(...)
    .pipe(plumber({errorHandler: onError}))
    .pipe(isProduction ? util.noop() : sourcemaps.init())
    .pipe(ts(tsProject));

  return tsResult.js
    .pipe(isProduction ? util.noop() : sourcemaps.write('.'))
    .pipe(gulp.dest(basePaths.test));
});

gulp.task('img', function () {
  return gulp.src(srcFiles.img, {cwd: basePaths.src})
    .pipe(plumber({errorHandler: onError}))
    .pipe(imagemin())
    .pipe(gulp.dest(basePaths.test + 'img'));
});

gulp.task('sprite', function () {
  return gulp.src(srcFiles.sprite, {cwd: basePaths.src})

    .pipe(plumber({errorHandler: onError}))
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest   : '.',
          sprite : 'sprite.svg',
          example: false,
        },
      },
    }))
    .pipe(gulp.dest(basePaths.test + 'img'));
});

gulp.task('html5lint', function () {
  return gulp.src(basePaths.release + srcFiles.html)
    .pipe(html5lint());
});

gulp.task('html', ['scss'], function () {
  return gulp.src(srcFiles.html, {cwd: basePaths.src})
    .pipe(plumber({errorHandler: onError}))
    .pipe(isProduction ? inlineSource({
      rootpath: basePaths.test,
    }) : util.noop())
    .pipe(isProduction ? htmlmin({
      collapseBooleanAttributes    : true,
      collapseWhitespace           : true,
      removeAttributeQuotes        : true,
      removeCDATASectionsFromCDATA : true,
      removeComments               : true,
      removeCommentsFromCDATA      : true,
      removeEmptyAttributes        : true,
      removeOptionalTags           : true,
      removeRedundantAttributes    : true,
      removeScriptTypeAttributes   : true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype              : false,
    }) : util.noop())
    .pipe(gulp.dest(basePaths.test));
});

gulp.task('semantic', function () {
  return gulp.src(srcFiles.semantic)
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(basePaths.test + 'semantic'));
});

// Default task
gulp.task('default', Object.keys(srcFiles));

gulp.task('release', ['default'], function () {
  // Revise all files
  var revAll = new RevAll({
    dontGlobal    : [
      'humans.txt',
      'robots.txt',
      'favicon.ico',
      'sitemap.txt',
    ],
    dontRenameFile: [
      'index.html',
    ],
  });

  return gulp.src(basePaths.test + '**')
    .pipe(revAll.revision())
    .pipe(gulp.dest(basePaths.release));
});

// Watch task
gulp.task('watch', ['default'], function () {

  Object.keys(srcFiles).forEach(function (element) {
    var watchedFiles = srcFiles[element];
    gulp.watch(watchedFiles, {cwd: basePaths.src}, [element]);
  });

  gulp.watch(['**/*.js', 'img/**', '**/*.html'], {cwd: basePaths.test}, browserSync.reload);

  browserSync({
    server: {
      baseDir   : basePaths.test,
      middleware: [historyApiFallback()],
    },
    open  : false,
  });
});

