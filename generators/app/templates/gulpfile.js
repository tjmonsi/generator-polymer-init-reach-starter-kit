var gulp = require('gulp');
var gulpif = require('gulp-if');
var watch = require('gulp-watch');
var path = require('path');
var injectSass = require('./gulp-tasks/inject-sass.js');
var injectPage = require('./gulp-tasks/inject-page.js');

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
/**
 * This is a three part gulpfile. 
 * 
 * 1. SASS Strategy
 * 2. Page Building Strategy
 * 3. Production Building Strategy
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

gulp.task('watch-all', function(){
  injectSass();
  injectPage();
  watch(['src/**/*.scss'], injectSass);
  watch(['config/pages.json'], injectPage);
});

//This is currently not used. But you can enable by uncommenting
// " //return gulp.src([basePath+ext,...excludeDirs])" above the return.
// var excludeDirs = [`!${basePath}bower_components/${ext}`,`!${basePath}images/${ext}`];

gulp.task('injectSass', injectSass);
gulp.task('injectPage', injectPage)


/**
 * PRODUCTION BUILD STRATEGY
 */ 
 
//   Got problems? Try logging 'em
// const logging = require('plylog');
// logging.setVerbose();



// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
var clean = require('./gulp-tasks/clean.js');
var images = require('./gulp-tasks/images.js');
var project = require('./gulp-tasks/project.js');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var cssSlam = require('css-slam').gulp;
var htmlMinifier = require('gulp-html-minifier');

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
    .pipe(gulpif(/\.js$/, babel({presets: ['es2015'], compact: true, minified: true})))
    .pipe(gulpif(/\.js$/, uglify({compress: true})))
    .pipe(gulpif(/\.css$/, cssSlam()))
    .pipe(gulpif(/\.html$/, htmlMinifier({collapseWhitespace: true, minifyCSS: true, minifyJS: true, removeComments: true})))
    .pipe(project.rejoin()); // Call rejoin when you're finished
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
    .pipe(gulpif(/\.js$/, babel({presets: ['es2015'], compact: true, minified: true})))
    .pipe(gulpif(/\.js$/, uglify({compress: true})))
    .pipe(gulpif(/\.css$/, cssSlam()))
    .pipe(gulpif(/\.html$/, htmlMinifier({collapseWhitespace: true, minifyCSS: true, minifyJS: true, removeComments: true})))
    .pipe(project.rejoin());
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  'injectSass',
  'injectPage',
  clean([global.config.build.rootDirectory]),
  project.merge(source, dependencies),
  project.serviceWorker
]));