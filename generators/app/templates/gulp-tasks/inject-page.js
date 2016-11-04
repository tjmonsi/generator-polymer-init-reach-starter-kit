var gulp = require('gulp');
var fs = require('fs');
var map = require('map-stream');
var gutil = require('gulp-util');
var name = 'src/<%= projectNameSlugged %>-app.html';

var injectPage = function () {

  gutil.log('Injecting Pages');

  return gulp.src(['config/pages.json'])
    .pipe(map(function(file, cb) {

      fs.readFile(file.path, function(err, data) {
        if (err || !data) {
          console.log(err);
          return cb();
        }

        try {
          var obj = JSON.parse(data);
          
          var shell = fs.readFileSync(name, 'utf-8');
          
          var startLazy = '<!-- LAZY LOADER STARTS HERE -->';
          var endLazy = '<!-- LAZY LOADER ENDS HERE -->';
          
          var startRouter = '<!-- ROUTER STARTS HERE -->';
          var endRouter = '<!-- ROUTER ENDS HERE -->';
          
          var startNavList = '/\\* NAVIGATION LIST STARTS HERE \\*/';
          var endNavList = '/\\* NAVIGATION LIST ENDS HERE \\*/'
          
          //Creates the regEx this ways so I can pass the variables. 
          var regLazy = new RegExp(startLazy+"[\\s\\S]*"+endLazy, "g");
          var regRouter = new RegExp(startRouter+"[\\s\\S]*"+endRouter, "g");
          var regNavList = new RegExp(startNavList+"[\\s\\S]*"+endNavList, "g")
          
          var navigationList = [];
          
          for (var n in obj.pages) {
            if (!obj.pages[n]['not-included-in-links']) {
              navigationList.push({
                label: obj.pages[n]['link-label'],
                url: obj.pages[n].url
              })  
            }
          }
    
          function pageTag(item) {
            var attrString = '';
            for (var i in item.attributes) {
              attrString += i + '=' + item.attributes[i] + ' ';
            }
            return item.tag ? 
                `<${item.tag} route="${item.route}" ` + 
                `scroll-progress="{{scrollProgress}}" ` + 
                `user="{{user}}" ` + 
                `${item.auth ? `auth="${item.auth}"` : ''} ` +
                attrString +
                `></${item.tag}>\n` : item;
          }
          
          var lazyString = startLazy + '\n' + obj.pages.reduce(function(prev, item) {
            var str = prev.tag ? `<link rel="lazy-import" href="${prev.source}" group="${prev.tag}">\n` : prev;
            str += item.tag ? `<link rel="lazy-import" href="${item.source}" group="${item.tag}">\n` : item;
            return str;
          }) + endLazy;
          
          var routerString = startRouter + '\n' + obj.pages.reduce(function(prev, item) {
            var str = pageTag(prev);
            str += pageTag(item);
            return str;
          }) + endRouter;
          
          var navigationListString = '/* NAVIGATION LIST STARTS HERE */' + 
                                      '\nreturn' + JSON.stringify(navigationList, null, '  ') + 
                                      ';\n' + 
                                      '/* NAVIGATION LIST ENDS HERE */';
          
          shell = shell.replace(regLazy, lazyString);
          shell = shell.replace(regRouter, routerString);
          shell = shell.replace(regNavList, navigationListString);
          
          fs.writeFile(name, shell, 'utf8', function(err) {
            if (err) {
              console.log(err);
            }
            return cb()
          });
        } catch (e) {
          return cb(e)
        }

          
      })
    }))
};

module.exports = injectPage;