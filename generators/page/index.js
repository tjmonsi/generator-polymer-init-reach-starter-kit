'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var slug = require('slug');
var _array = require('lodash/array');

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the gnarly page ' + chalk.red('generator-polymer-init-reach-starter-kit') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'tagName',
      message: 'What would be the component name of the page?',
      default: 'page',
      
    }, 
    {
      type: 'input',
      name: 'label',
      message: 'What would be the link label of this page',
      default: 'Page'
    },
    
    {
      type: 'input',
      name: 'route',
      message: 'What would be the route pattern of this page? (i.e. /page or /page/:id if you need to add a paramater)',
      default: '/page'
    },
    
    {
      type: 'input',
      name: 'url',
      message: 'What would be the default url to access this page?',
      default: '/page'
    },

    {
      type: 'confirm',
      name: 'notIncludedInLink',
      message: 'Should this be included in the links?',
      default: true
    },{
      type: 'input',
      name: 'auth',
      message: 'If it needs to be authenticated, put here the variable name or function with parameters that will run to check for authentication',
      default: '',
    },{
      type: 'input',
      name: 'attributes',
      message: 'What are the other attribute-value pairs that you want to include?\n(type it out as if writing in Polymer separated by space\ni.e. attribute-1="value-1" attribute-2="{{doubleBindedVar}}" attribute-3="[[singleBindedVar]]" boolean-attribute )\n',
      default: ''
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      var baseTagName = slug(props.tagName.trim());
      props.tagName = props.auth && props.auth !== '' ? 'app-' + baseTagName : 'web-' + baseTagName;
      this.props = props;
    }.bind(this));
  },

  writing: function () {
    
    var str = this.read(this.destinationPath('config/pages.json'));
    var tagName = this.props.tagName;
    var src = 'src/pages/' + tagName + '/' + tagName;
    var obj = JSON.parse(str);
    
    if (_array.findIndex(obj.pages, function(o) { return o.tag == tagName; }) < 0) {
      var el = {
        tag: this.props.tagName,
        "link-label": this.props.label,
        route: this.props.route,
        url: this.props.url,
        source: '/' + src + '.html',
        auth: this.props.auth && this.props.auth !== '' ? "[[" + this.props.auth + "]]" : null,
        attributes: {}
      };
      
      if (!this.props.notIncludedInLink) {
        el['not-included-in-links'] = !this.props.notIncludedInLink;
      }
      
      var attr = this.props.attributes.trim().split(/ /g);
      
      for (var i in attr) {
        var arr = attr[i].split('=');
        if (arr.length === 1) {
          el.attributes[arr[0]] = '';
        } else {
          var ax = arr.splice(0, 1);
          el.attributes[ax] = arr.join('');  
        }
      }
      
      obj.pages.push(el);
      
      this.write(this.destinationPath('config/pages.json'), JSON.stringify(obj, null, '  '));
      
      var polymerStr = this.read(this.destinationPath('polymer.json'));
      var polymerObj = JSON.parse(polymerStr);
      
      if (polymerObj.fragments.indexOf(src + '.html') < 0) {
        polymerObj.fragments.push(src + '.html');
      }
      
      this.write(this.destinationPath('polymer.json'), JSON.stringify(polymerObj, null, '  '));
      
      this.fs.copyTpl(
        this.templatePath('web-page-style.html'),
        this.destinationPath(src + '-style.html'),
        this.props
      );
      
      this.fs.copyTpl(
        this.templatePath('web-page-style.scss'),
        this.destinationPath(src + '-style.scss'),
        this.props
      );
      
      this.fs.copyTpl(
        this.templatePath('web-page.html'),
        this.destinationPath(src + '.html'),
        this.props
      );
      
      var shell = this.read(this.destinationPath('src/'+ slug(this.determineAppname().trim()) + '-app.html'));
      
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
      
      this.write(this.destinationPath('src/'+ slug(this.determineAppname().trim()) + '-app.html'), shell);
    } 
    else {
      console.log(tagName + ' already exists. Please pick another or change the pages.json');
    }
    
    
  }
});
