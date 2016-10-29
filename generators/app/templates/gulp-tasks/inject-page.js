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
          
          var startLazy = '<!-- LAZY LOADER STARTS HERE -->';
          var endLazy = '<!-- LAZY LOADER ENDS HERE -->';
          
          var startRouter = '<!-- ROUTER STARTS HERE -->';
          var endRouter = '<!-- ROUTER ENDS HERE -->';
          
          //Creates the regEx this ways so I can pass the variables. 
          var regLazy = new RegExp(startLazy+"[\\s\\S]*"+endLazy, "g");
          var regRouter = new RegExp(startRouter+"[\\s\\S]*"+endRouter, "g");
          
          var shell = fs.readFileSync(name, 'utf-8');
          
          function elementAttribute(i) {
            return i.attribute ? i.attribute + (i.value ? '=' + i.value + ' ' : '') : i;
          }
          
          function pageTag(item) {
            var attr = [];
            for (var i in item.attributes) {
              attr.push({
                attribute: i,
                value: item.attributes[i]
              });
            }
            return item.tag ? 
                `<${item.tag} name="${item.route}"` + 
                `label="${item['link-label']}"` + 
                `scroll-progress="{{scrollProgress}}"` + 
                `user="{{user}}"` + 
                `query-params="{{queryParams}}"` + 
                `${item['not-included-in-links'] ? 'not-included-in-links' : ''} ` + 
                `${item.auth ? 'auth' : ''} ` +
                (attr.length > 0 ? attr.reduce(function(p, i) {
                  var str = elementAttribute(p);
                  str += elementAttribute(i);
                  return str;
                }) : '') +
                `></${item.tag}>\n` : item;
          }
          
          var lazyString = startLazy + '\n' + obj.pages.reduce(function(prev, item) {
            var str = prev.tag ? `<link rel="lazy-import" href="${prev.source}" group="${prev.tag}">\n` : prev;
            str += item.tag ? `<link rel="lazy-import" href="${item.source}" group="${item.tag}">\n` : item;
            return str;
          }) + endLazy;
          
          var routerString = startRouter + '\n' + obj.pages.reduce(function(prev, item) {
            var str = pageTag(prev);
            if (!item['not-included-in-router']) {
              str += pageTag(item);
            }
            return str;
          }) + endRouter;
          
          shell = shell.replace(regLazy, lazyString);
          shell = shell.replace(regRouter, routerString);
          
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