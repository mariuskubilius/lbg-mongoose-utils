//dependencies
var assert = require('assert');
var async = require('async');
var mongoose = require('mongoose');
//mongoose.set('debug', true);
var ancestorTree = require('../lib/ancestorTree');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;