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
      'Welcome to the gnarly ' + chalk.red('generator-polymer-init-reach-starter-kit') + ' generator!'
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
      default: false
    },
    {
      type: 'confirm',
      name: 'notIncludedInLink',
      message: 'Should this be included in the links?',
      default: false
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
    var src = '/src/pages/' + tagName + '/' + tagName;
    var obj = JSON.parse(str);
    
    if (_array.findIndex(obj.pages, function(o) { return o.tag == tagName; }) < 0) {
      var el = {
        tag: this.props.tagName,
        "link-label": this.props.label,
        route: this.props.route,
        source: src + '.html'
      };
      
      if (this.props.notIncludedInRouter) {
        el['not-included-in-router'] = this.props.notIncludedInRouter;
      }
      
      if (this.props.notIncludedInLink) {
        el['not-included-in-link'] = this.props.notIncludedInLink;
      }
      
      obj.pages.push(el);
      
      this.write(this.destinationPath('config/pages.json'), JSON.stringify(obj, null, '  '));
      
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
    } 
    else {
      console.log(tagName + ' already exists. Please pick another or change the pages.json');
    }
    
    
  }
});
