//dependencies
var assert = require('assert');
var mongoose = require('mongoose');
var mongooseUtils = require('../index');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;

describe('index', function () {
  var MockSchema = new Schema();
  
  describe('#default', function() {
    MockSchema.plugin(mongooseUtils.slugify);
    MockSchema.plugin(mongooseUtils.ancestorTree);
    it('should be initialising all fields.', function(done){
      assert.strictEqual(typeof MockSchema.paths.title, 'object');
      assert.strictEqual(typeof MockSchema.paths.slug, 'object');
      assert.strictEqual(typeof MockSchema.paths.parent, 'object');
      assert.strictEqual(typeof MockSchema.paths.ancestors, 'object');
      done();
    });
  });
});
