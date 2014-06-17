/**
 * @author: biangang
 * @date: 2014/6/16
 */
'use strict';
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
    pattern: 'gulp-*',
    config: 'package.json',
    scope: ['devDependencies'],
    replaceString: 'gulp-',
    cameLize: true,
    lazy: true
});