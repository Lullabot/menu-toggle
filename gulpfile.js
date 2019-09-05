/* eslint-env node, es6 */
/* global require */
'use strict';

/**
 * Configuration
 */
// Load dependencies
const {parallel, src, dest, task, watch,} = require('gulp'),
      gulpIf = require('gulp-if'),
      sourceMaps = require('gulp-sourcemaps'),
      sass = require('gulp-sass'),
      sassLint = require('gulp-sass-lint'),
      postCss = require('gulp-postcss'),
      autoprefixer = require('autoprefixer'),
      cssNano = require('cssnano'),
      pxToRem = require('postcss-pxtorem'),
      babel = require('gulp-babel'),
      uglify = require('gulp-uglify'),
      eslint = require('gulp-eslint'),
      concat = require('gulp-concat');

// File locations
const cssSource = './scss/**/*.scss',
      cssOutput = './css/';

// Create easier to read errors
const logError = (error) => console.log(
`\n- Begin error ----------\n
${error}
\n- End error ------------\n`
);

const isDev = process.env.NODE_ENV === 'dev';

if (isDev) {
  console.log('/************************\n * Compiling in DEV mode!\n */\n');
}
else {
  console.log('/*************************\n * Compiling in PROD mode.\n */\n');
}

/**
 * CSS Compilation
 */
const processScss = () =>
  src(cssSource)
  // Lint first
  .pipe(sassLint())
  .pipe(sassLint.format())
  // .pipe(sassLint.failOnError())
  // Start compiling
  .pipe(gulpIf(isDev, sourceMaps.init()))
  .pipe(sass())
  .pipe(
    postCss([
      pxToRem({
        'propList': ['*',],
      }),
      autoprefixer(),
    ])
  )
  // Minify if production build
  .pipe(gulpIf(!isDev, postCss([cssNano(),])))
  .pipe(gulpIf(isDev, sourceMaps.write()))
  .pipe(dest(cssOutput));

const compileCSS = processScss;

/**
 * Vanilla Object JS Compilation
 */
const compileVanillaObject = () =>
  src([
    './source/vanilla-object/polyfill.js',
    './source/vanilla-object/events.js',
    './source/vanilla-object/menu-toggle.js',
    ])
  .pipe(concat('menu-toggle.js'))
  .pipe(gulpIf(isDev, sourceMaps.init()))
  .pipe(eslint())
  .pipe(eslint.format())
  // .pipe(eslint.failAfterError())
  .pipe(
    babel({
    'presets': ['@babel/preset-env',],
    })
    // Provide meaningful error output
    .on('error', (error) => logError(error))
  )
  // Minify if production build
  .pipe(gulpIf(!isDev, uglify()))
  .pipe(gulpIf(isDev, sourceMaps.write()))
  .pipe(dest('./distributable/vanilla-object/'));

/**
 * ES6 Module JS Compilation
 */
const compileEs6ModuleJavascript = () =>
  src('source/es6-module/**/*.js')
  .pipe(gulpIf(isDev, sourceMaps.init()))
  .pipe(eslint())
  .pipe(eslint.format())
  // .pipe(eslint.failAfterError())
  .pipe(
    babel({
    'presets': ['@babel/preset-env',],
    })
    // Provide meaningful error output
    .on('error', (error) => logError(error))
  )
  // Minify if production build
  .pipe(gulpIf(!isDev, uglify()))
  .pipe(gulpIf(isDev, sourceMaps.write()))
  .pipe(dest('./distributable/es6-module/'));

/**
 * Example JS Compilation
 */
const compileExampleJavascript = () =>
  src('./source/example-code/**/*.js')
  .pipe(gulpIf(isDev, sourceMaps.init()))
  .pipe(eslint())
  .pipe(eslint.format())
  // .pipe(eslint.failAfterError())
  .pipe(
    babel({
    'presets': ['@babel/preset-env',],
    })
    // Provide meaningful error output
    .on('error', (error) => logError(error))
  )
  // Minify if production build
  .pipe(gulpIf(!isDev, uglify()))
  .pipe(gulpIf(isDev, sourceMaps.write()))
  .pipe(dest('./distributable/example-code/'));

/**
 * Watch Files
 */
const watchFiles = (done) => {
  watch(
    [
      cssSource,
    ],
    compileCSS
  );
  watch('./source/vanilla-object/', compileVanillaObject);
  watch('./source/es6-module/', compileEs6ModuleJavascript);
  watch('./source/example-code/', compileExampleJavascript);
  done();
};

task('default', parallel(compileCSS, compileVanillaObject, compileEs6ModuleJavascript, compileExampleJavascript));
task('watch', watchFiles);
