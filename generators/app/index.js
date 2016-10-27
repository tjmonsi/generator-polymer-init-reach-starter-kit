'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var slug = require('slug');

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the gnarly ' + chalk.red('generator-polymer-init-reach-starter-kit') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'projectName',
      message: 'What would you like this project to be named?',
      default: 'Reach Project'
    }, {
      type: 'input',
      name: 'projectDescription',
      message: 'Give a brief description of the project',
      default: 'This is a brief description of the Reach Project'
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      props.projectNameSlugged = slug(props.trim().toLowerCase());
      this.props = props;
    }.bind(this));
  },

  writing: function () {
    //var projectName = this.props.projectName;
    var projectNameSlugged = this.props.projectNameSlugged;
    //var projectDescription = this.props.projectDescription;
    
    this.fs.copyTpl(
      this.templatePath() + '/**/!(_)*',
      this.destinationPath(),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_variables.scss'),
      this.destinationPath('src/_variables.scss'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-name.html'),
      this.destinationPath('src/' + projectNameSlugged + '-app.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-header/_project-header.html'),
      this.destinationPath('src/' + projectNameSlugged + '-header/' + projectNameSlugged + '-header.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-header/_project-header-style.html'),
      this.destinationPath('src/' + projectNameSlugged + '-header/' + projectNameSlugged + '-header-style.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-header/_project-header-style.scss'),
      this.destinationPath('src/' + projectNameSlugged + '-header/' + projectNameSlugged + '-header-style.scss'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-drawer/_project-drawer.html'),
      this.destinationPath('src/' + projectNameSlugged + '-drawer/' + projectNameSlugged + '-drawer.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-drawer/_project-drawer-style.html'),
      this.destinationPath('src/' + projectNameSlugged + '-drawer/' + projectNameSlugged + '-drawer-style.html'),
      this.props
    );
    
    this.fs.copyTpl(
      this.templatePath('src/_project-drawer/_project-drawer-style.scss'),
      this.destinationPath('src/' + projectNameSlugged + '-drawer/' + projectNameSlugged + '-drawer-style.scss'),
      this.props
    );
    
    
    // this.fs.copy(
    //   this.templatePath('dummyfile.txt'),
    //   this.destinationPath('dummyfile.txt')
    // );
  },

  install: function () {
    this.installDependencies();
  }
});
