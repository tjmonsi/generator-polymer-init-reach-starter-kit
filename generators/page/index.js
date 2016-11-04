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
      default: 'web-page',
      
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
      message: 'What would be the route of this page',
      default: 'page'
    },
    {
      type: 'confirm',
      name: 'notIncludedInRouter',
      message: 'Should this be included in the router?',
      default: true
    },
    {
      type: 'confirm',
      name: 'notIncludedInLink',
      message: 'Should this be included in the links?',
      default: true
    },{
      type: 'confirm',
      name: 'auth',
      message: 'Does the user needs to be authenticated before seeing this page?',
      default: false
    },{
      type: 'input',
      name: 'attributes',
      message: 'What are the other attribute-value pairs that you want to include?\n(type it out as if writing in Polymer separated by space\ni.e. attribute-1="value-1" attribute-2="{{doubleBindedVar}}" attribute-3="[[singleBindedVar]]" boolean-attribute )\n',
      default: ''
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      props.tagName = slug(props.tagName.trim());
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
        source: '/' + src + '.html',
        auth: this.props.auth,
        attributes: {}
      };
      
      if (!this.props.notIncludedInRouter) {
        el['not-included-in-router'] = !this.props.notIncludedInRouter;
      }
      
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
      
      var startLazy = '<!-- LAZY LOADER STARTS HERE -->';
      var endLazy = '<!-- LAZY LOADER ENDS HERE -->';
      
      var startRouter = '<!-- ROUTER STARTS HERE -->';
      var endRouter = '<!-- ROUTER ENDS HERE -->';
      
      //Creates the regEx this ways so I can pass the variables. 
      var regLazy = new RegExp(startLazy+"[\\s\\S]*"+endLazy, "g");
      var regRouter = new RegExp(startRouter+"[\\s\\S]*"+endRouter, "g");
      
      var shell = this.read(this.destinationPath('src/'+ slug(this.determineAppname().trim()) + '-app.html'));
      
      var lazyString = startLazy + '\n' + obj.pages.reduce(function(prev, item) {
        var str = prev.tag ? `<link rel="lazy-import" href="${prev.source}" group="${prev.tag}">\n` : prev;
        str += item.tag ? `<link rel="lazy-import" href="${item.source}" group="${item.tag}">\n` : item;
        return str;
      }) + endLazy;
      
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
            `<${item.tag} name="${item.route}" ` + 
            `label="${item['link-label']}" ` + 
            `scroll-progress="{{scrollProgress}}" ` + 
            `user="{{user}}" ` + 
            `query-params="{{queryParams}}" ` + 
            `${item['not-included-in-links'] ? 'not-included-in-links' : ''} ` + 
            `${item.auth ? 'auth' : ''} ` +
            (attr.length > 0 ? attr.reduce(function(p, i) {
              var str = elementAttribute(p);
              str += elementAttribute(i);
              return str;
            }) : '') +
            `></${item.tag}>\n` : item;
      }
      
      var routerString = startRouter + '\n' + obj.pages.reduce(function(prev, item) {
        var str = pageTag(prev);
        if (!item['not-included-in-router']) {
          str += pageTag(item);
        }
        return str;
      }) + endRouter;
      
      shell = shell.replace(regLazy, lazyString);
      shell = shell.replace(regRouter, routerString);
      
      this.write(this.destinationPath('src/'+ slug(this.determineAppname().trim()) + '-app.html'), shell);
    } 
    else {
      console.log(tagName + ' already exists. Please pick another or change the pages.json');
    }
    
    
  }
});
