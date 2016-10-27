var gulp = require('gulp');
var gulpif = require('gulp-if');
var watch = require('gulp-watch');
var nodeSass = require('node-sass');
var path = require('path');
var fs = require('fs');
var map = require('map-stream');
var basePath = "";
var excludeDir = basePath+"bower_components/";
var ext = "**/*.scss";
var polymerPath = 'bower_components/polymer/polymer.html';

/**
 * This is a two part gulpfile. 
 * 
 * 1. SASS Strategy
 * 2. Production Building Strategy
 */  

/**
 * SASS STRATEGY
 */ 

/**
 * We need to specify to nodeSass the include paths for Sass' @import
 * command. These are all the paths that it will look for it.
 *
 * Failing to specify this, will NOT Compile your scss and inject it to
 * your .html file.
 *
 */
var includePaths = ['src/**/', 'src/pages/**/', 'src/'];

var injectSass = function () {
  /* Original creator: David Vega. I just modified
  * it to take advantage of the Polymer 1.1's shared styles.
  *
  * This will look all the files that are inside:
  * app/elements folder. You can change this to match
  * your structure.  Note, this gulp script uses convention
  * over configuration. This means that if you have a file called
  * my-element-styles.html you should have a file called
  * my-element-styles.scss
  *
  * Note #2:
  * We use "!" (Exclamation Mark) to exclude gulp from searching these paths.
  * What I'm doing here, is that Polymer Starter Kit has inside its app folder
  * all the bower dependencies (bower_components). If we don't specify it to
  * exclude this path, this will look inside bower_components and will take a long time
  * (around 7.4 seconds in my machine) to replace all the files.
  */
  //Uncomment if you want to specify multiple exclude directories. Uses ES6 spread operator.
  //return gulp.src([basePath+ext,...excludeDirs])

  console.log('Starting');

  return gulp.src([basePath + 'src/' + ext, basePath + 'src/pages/' + ext, '!'+excludeDir+ext])
    .pipe(map(function(file, cb) {
      if (path.basename(file.path, '.scss').indexOf('_') === 0) {
        return cb();
      }
      var styleName = path.basename(file.path, '.scss');

      fs.readFile(file.path, function(err, data) {
        if (err || !data) {
          console.log(err)
          return cb();
        }

        nodeSass.render({
          data: data.toString(),
          includePaths: includePaths,
          // outputStyle: 'compressed'
        }, function(err, compiledScss) {
          if (err || !compiledScss) {
            console.log(err)
            return cb();
          }

          var newPolymerPath = (path.relative(path.dirname(file.path), path.resolve(polymerPath)));

          var string = `<link rel="import" href="${newPolymerPath}">\n<dom-module id="${styleName}">\n<template>\n<style>\n` +
            compiledScss.css.toString() +
            '\n</style>\n</template>\n</dom-module>'

          fs.writeFile(path.join(path.dirname(file.path), styleName + '.html'), string, 'utf8', function(err) {
            if (err) {
              console.log(err);
            }
            return cb()
          })
        })
      })
    }))
};


// gulp.task('default', ['injectSass', 'watchSass'])

gulp.task('watchSass', function(){
  watch(['src/**/*.scss'], injectSass);
});

//This is currently not used. But you can enable by uncommenting
// " //return gulp.src([basePath+ext,...excludeDirs])" above the return.
// var excludeDirs = [`!${basePath}bower_components/${ext}`,`!${basePath}images/${ext}`];

gulp.task('injectSass', injectSass);

/**
 * PRODUCTION BUILD STRATEGY
 */ 

global.config = {
  polymerJsonPath: path.join(process.cwd(), 'polymer.json'),
  build: {
    rootDirectory: 'build',
    bundledDirectory: 'bundled',
    unbundledDirectory: 'unbundled',
    // Accepts either 'bundled', 'unbundled', or 'both'
    // A bundled version will be vulcanized and sharded. An unbundled version
    // will not have its files combined (this is for projects using HTTP/2
    // server push). Using the 'both' option will create two output projects,
    // one for bundled and one for unbundled
    bundleType: 'both'
  },
  // Path to your service worker, relative to the build root directory
  serviceWorkerPath: 'service-worker.js',
  // Service Worker precache options based on
  // https://github.com/GoogleChrome/sw-precache#options-parameter
  swPrecacheConfig: {
    navigateFallback: '/index.html'
  }
};

// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
var clean = require('./gulp-tasks/clean.js');
var images = require('./gulp-tasks/images.js');
var project = require('./gulp-tasks/project.js');

// The source task will split all of your source files into one
// big ReadableStream. Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json.
// Because most HTML Imports contain inline CSS and JS, those inline resources
// will be split out into temporary files. You can use gulpif to filter files
// out of the stream and run them through specific tasks. An example is provided
// which filters all images and runs them through imagemin
function source() {
  return project.splitSource()
    // Add your own build tasks here!
    .pipe(gulpif('**/*.{png,gif,jpg,svg}', images.minify()))
    .pipe(project.rejoin()); // Call rejoin when you're finished
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
    .pipe(project.rejoin());
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  clean([global.config.build.rootDirectory]),
  project.merge(source, dependencies),
  project.serviceWorker
]));