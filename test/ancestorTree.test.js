//dependencies
var assert = require('assert');
var mongoose = require('mongoose');
//mongoose.set('debug', true);
var slugify = require('../lib/ancestorTree');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

describe('ancestorTree', function () {
  var MockSchema = new Schema();
  
  describe('#default()', function() {
    MockSchema.plugin(ancestorTree);
    var MockModel = db.model('ancestorMock', MockSchema);
    var parent   = new MockModel({});
    var child    = new MockModel({parent: parent._id});
    var subChild = new MockModel({parent: child._id});
    
    before(function() {
      MockModel.remove(function(err) {
      	assert.strictEqual(err, null);
      });
    });
    
    it('should have custom properties set', function (done) {
      assert.strictEqual(typeof MockSchema.paths.parent, 'object');
      assert.strictEqual(typeof MockSchema.paths.ancestors, 'object');
      done();
    });
    
    it('should save and set hierarchy where aplicable', function (done) {
      parent.save(function(err, doc){
        assert.strictEqual(err, null);
        assert.strictEqual(typeof doc.parent, 'undefined');
        assert.strictEqual(typeof doc.ancestors, 'object');
        assert.strictEqual(doc.parent, undefined);
        assert.strictEqual(doc.ancestors.length, 0);
        child.save(function(err,doc){
          assert.strictEqual(err, null);
          assert.strictEqual(typeof doc.parent, 'object');
          assert.strictEqual(doc.parent, parent._id);
          assert.strictEqual(typeof doc.ancestors, 'object');
          assert.strictEqual(doc.ancestors.length, 1);
          assert.strictEqual(doc.ancestors[0], parent._id);
          subChild.save(function(err, doc){
            assert.strictEqual(err, null, 'should be no errors thrown');
            assert.strictEqual(doc.ancestors.length, 2, 'should be length of 2');
            assert.strictEqual(doc.ancestors[1], child._id, 'second item should be last added');
            done();
          });
        });
      });
    });
    
  });
  
  describe('#update()', function(){
    MockSchema.plugin(ancestorTree);
    var MockModel = db.model('ancestorMock', MockSchema);
    var p   = new MockModel({});
    var c   = new MockModel({parent: p._id});
    var sc  = new MockModel({parent: c._id});
    var ap  = new MockModel({});
    var ac  = new MockModel({parent: ap._id});
    var asc = new MockModel({parent: ac._id});
    
    before(function() {
      MockModel.remove(function(err) {
      	assert.strictEqual(err, null);
      });
    });
    
    it ('should save and update ancestors.', function (done) {
      p.save(function(err,doc){
        assert.strictEqual(err, null, 'item without parent should save.');
        c.save(function(err, doc){
          sc.save(function(err,doc) {
           ap.save(function(err,doc) {
             ac.save(function(err,doc) {
               asc.save(function(err,doc) {
                 assert.strictEqual(err, null, 'should be no errors while saving.');
                 ac.parent = c;
                 ac.save(function(err,doc){
                   assert.strictEqual(err, null, 'should be no errors while saving.');
                   MockModel.findOne({_id: asc._id}, function(err, doc){
                     assert.strictEqual(doc.ancestors[0].toString(), p._id.toString(), 'hierarchy should be updated to the new tree');
                     assert.strictEqual(doc.ancestors[1].toString(), c._id.toString(), 'hierarchy should be updated in children');
                     assert.strictEqual(doc.ancestors.length, 3)
                     c.parent = undefined;
                     c.save(function(err,doc){
                       assert.strictEqual(err, null);
                       done();
                     });
                   });
                 })
               });
             });
           });
          });
        });
      });
    
    });
    
  });
  
});
