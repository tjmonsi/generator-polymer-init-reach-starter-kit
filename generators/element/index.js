'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var slug = require('slug');

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the gnarly page ' + chalk.red('generator-polymer-init-reach-starter-kit') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'bundle',
      message: 'What would be the bundle you want this element to be part of?',
      default: 'element-bundle',
      
    }, 
    {
      type: 'input',
      name: 'element',
      message: 'What would be the name of the reusable component you want to create?',
      default: 'element-component'
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      props.bundle = slug(props.bundle.trim());
      props.element = slug(props.element.trim());
      this.props = props;
    }.bind(this));
  },

  writing: function () {
    var element = this.props.element;
    var bundle = this.props.bundle;
      
    this.fs.copyTpl(
      this.templatePath('element-component.html'),
      this.destinationPath('src/' + bundle + '/' + element + '/' + element + '.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('element-component-style.html'),
      this.destinationPath('src/' + bundle + '/' + element + '/' + element + '-style.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('element-component-style.scss'),
      this.destinationPath('src/' + bundle + '/' + element + '/' + element + '-style.scss'),
      this.props
    );
  }
});
