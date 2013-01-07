//dependencies
var assert = require('assert');
var mongoose = require('mongoose');
var slugify = require('../lib/slugify');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

describe('slugify', function () {
  var MockSchema = new Schema();
  
  describe('#default()', function() {
    MockSchema.plugin(slugify);
    var MockModel = db.model('slugMock', MockSchema);
    var mock = new MockModel({ title: 'I will & be @ Slugiffied'});

    before(function() {
      MockModel.remove(function(err) {
      	assert.strictEqual(err, null);
      });
    });
    
    it('should have custom properties set', function (done) {
      assert.strictEqual(typeof MockSchema.paths.title, 'object');
      assert.strictEqual(typeof MockSchema.paths.slug, 'object');
      assert.strictEqual(typeof MockSchema.methods.slugify, 'function');
      assert.strictEqual(typeof MockSchema.statics.slugify, 'function');
      done();
    });
    
    it('should correctly format a slug', function(done) {
      mock.save(function(err, doc) {
        assert.strictEqual(err, null);
        assert.strictEqual(typeof doc.slug, 'string');
        assert.strictEqual(doc.slug, 'i-will-be-slugiffied');
        done();
      });
    });
    
    it('should keep the slug the same', function(done) {
      mock.title = 'My new nice title';
      mock.save(function(err,doc) {
        assert.strictEqual(err,null);
        assert.strictEqual(typeof doc.slug, 'string');
        assert.strictEqual(doc.slug, 'i-will-be-slugiffied');
        done();
      });
    });
    
    it('should change the slug', function(done) {
  	  mock.slug = 'new-nice slug';
      mock.save(function(err,doc) {
        assert.strictEqual(err, null);
        assert.strictEqual(typeof doc.slug, 'string');
        assert.strictEqual(doc.slug, 'new-nice-slug');
        done();
      });
    });
    
    it('should manually slugify', function (done) {
      var str = 'one two three';
      assert.strictEqual(mock.slugify(str), 'one-two-three');
      assert.strictEqual(MockModel.slugify(str), 'one-two-three');
      done();
    });
    
  });
  
  describe('#duplicates()', function() {
    MockSchema.plugin(slugify);
    var MockModel = db.model('slugMock', MockSchema);
    var mock1 = new MockModel({ title: 'duplicated slug'});
    var mock2 = new MockModel({ title: 'duplicated slug'});
    var mock3 = new MockModel({ title: 'duplicated slug'});
    
    before(function() {
      MockModel.remove(function(err) {
      	assert.strictEqual(err, null);
      });
    });
    
    it('should deal gracefully with duplicates', function(done) {
      mock1.save(function(err, doc) {
        assert.strictEqual(err,null);
        assert.strictEqual(doc.slug, 'duplicated-slug');
        mock2.save(function(err, doc) {
          assert.strictEqual(err, null);
          assert.strictEqual(doc.slug, 'duplicated-slug-1');
          mock3.save(function(err, doc) {
        	assert.strictEqual(err, null);
	        assert.strictEqual(doc.slug, 'duplicated-slug-2');
        	done();
          });
        });
      });
    });
  });
  
});
