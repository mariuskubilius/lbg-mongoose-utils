//dependencies
var assert = require('assert');
var async = require('async');
var mongoose = require('mongoose');
//mongoose.set('debug', true);
var ancestorTree = require('../lib/ancestorTree');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

describe('ancestorTree', function () {
  var MockSchema = new Schema();
  
  describe('#default()', function() {
    MockSchema.plugin(ancestorTree);
    var MockModel = db.model('ancestorMock', MockSchema);
    var parent   = new MockModel({parent:''});
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
      async.waterfall([
        function(cb){
          parent.save(function(err, doc){
            assert.strictEqual(typeof doc.parent, 'undefined', 'parent should be not set');
            assert.strictEqual(typeof doc.ancestors, 'object', 'ancestors should be array');
            assert.equal(doc.parent, undefined, 'no parent should be set');
            assert.strictEqual(doc.ancestors.length, 0, 'ancestors array should be empty');
            cb(err);
          });
        },
        function(cb){
          child.save(function(err,doc){
            assert.strictEqual(typeof doc.parent, 'object');
            assert.strictEqual(doc.parent, parent._id);
            assert.strictEqual(typeof doc.ancestors, 'object');
            assert.strictEqual(doc.ancestors.length, 1);
            assert.strictEqual(doc.ancestors[0], parent._id);
            cb(err);
          });
        },
        function(cb){
          subChild.save(function(err, doc){
            assert.strictEqual(doc.ancestors.length, 2, 'should be length of 2');
            assert.strictEqual(doc.ancestors[1], child._id, 'second item should be last added');
            cb(err);
          });
        }
      ], 
      function(err){
        assert.strictEqual(err, null, 'should be no errors thrown');
        done();
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
      async.waterfall([
        function(cb) {
          p.save(function(err,doc) {
            cb(err);
          });
        },
        function(cb) {
          c.save(function(err,doc) { 
            cb(err);
          });
        },
        function(cb) {
          sc.save(function(err,doc) {
            cb(err);
          });
        },
        function(cb) {
          ap.save(function(err,doc) {
            cb(err);
          });
        },
        function(cb) {
          ac.save(function(err,doc) {
            cb(err);
          });
        },
        function(cb) {
          asc.save(function(err,doc) {
            cb(err);
          });
        },
        function(cb){
          ac.parent = c;
          ac.save(function(err,doc){
            MockModel.findOne({_id: asc._id}, function(err, doc){
              assert.strictEqual(doc.ancestors[0].toString(), p._id.toString(), 'hierarchy should be updated to the new tree');
              assert.strictEqual(doc.ancestors[1].toString(), c._id.toString(), 'hierarchy should be updated in children');
              assert.strictEqual(doc.ancestors.length, 3, 'there should be 3 ancestors');
              cb(err);
            });
          });
        },
        function(cb){
          c.parent = undefined;
          c.save(function(err,doc){
            MockModel.findOne({_id: sc._id}, function(err, doc){
              assert.strictEqual(doc.ancestors.length, 1, 'there should be only one ancestor left');
              assert.strictEqual(c._id.toString(), doc.ancestors[0].toString(), 'ancestores are being changed correctly');
              cb(err);
            });
          });
        }
      ],
      function(err){
        assert.strictEqual(err, null, 'should be no errors');
        done();
      });
    });
    
    it('should retrieve children.', function(done){
      MockModel.findOne({_id: c._id}, function(err, doc){
        async.waterfall([
          function(cb) {
            doc.findDirectChildren({fields:{_id:1}}, function(err, children){
              assert.strictEqual(children.length, 2, 'there should be 2 direct children');
              cb(err);
            });
          },
          function(cb) {
            doc.findChildren({fields:{_id:1}}, function(err, children){
              assert.strictEqual(children.length, 3, 'there should be 3 children');
              assert.strictEqual(children[0]._id.toString(), sc._id.toString());
              assert.strictEqual(children[1]._id.toString(), ac._id.toString());
              assert.strictEqual(children[2]._id.toString(), asc._id.toString());
              cb(err);
            });
          },
          function(cb) {
            doc.findChildren(function(err, children){
              assert.strictEqual(err, null, 'should work with one argument only.');
              cb(err);
            });
          }

        ],
        function(err){
          assert.strictEqual(err, null, 'should be no errors');
          done();
        });
        
      });
    });
    
    it('should retrieve ancestors.', function(done){
      MockModel.findOne({_id: asc._id}, function(err, doc){
        doc.getAncestors({fields:'_id'}, function(err, ancestors) {
          assert.strictEqual(ancestors.length, 2, 'asc is 2 levels deep');
          assert.strictEqual(ancestors[0]._id.toString(), c._id.toString());
          assert.strictEqual(ancestors[1]._id.toString(), ac._id.toString());
          done();
        });
      });
    });
    
    it('should not delete items with children.', function(done){
      MockModel.findOne({_id: c._id}, function(err, doc){
        doc.remove(function(err, res){
          assert.strictEqual('Please delete/move all children before proceeding', err.message);
          MockModel.count({_id: c._id}, function(err, count){
            assert.strictEqual(err, null);
            assert.strictEqual(count, 1);
            done();
          });
        });
      });
    });
    
    it('should Delete items without children.', function(done){
      MockModel.findOne({_id: asc._id}, function(err, doc){
        doc.remove( function(err, res){
          assert.strictEqual(err, null);
          MockModel.count({_id: asc._id}, function(err, count){
            assert.strictEqual(err, null);
            assert.strictEqual(count, 0);
            done();
          });
        });
      });
    });
    
  });
  
});
