//dependencies
var assert = require('assert');
var async = require('async');
var mongoose = require('mongoose');
//mongoose.set('debug', true);
var status = require('../lib/status');
var common = require('./utils/common');
var db = common.db;
var Schema = mongoose.Schema;

describe ('status', function () {
	var MockSchema = new Schema();
	MockSchema.plugin(status);
	var MockModel = db.model('statusMock', MockSchema);
	var doc = new MockModel();
	
	describe('#schema', function () {
		before(function () {
			MockModel.remove(function (err) {
				assert.strictEqual(err, null, 'There should be no errors while deleting status stuff');
			});
		});
		
		it('Should set status field in schema', function (done) {
			assert.strictEqual(typeof MockSchema.paths.status, 'object', 'Status field is set in schema');
			done();
		});
		
		it('Should set field value to zero as default', function (done) {
			assert.strictEqual(doc.status, 0, 'document status equals to 0');
			done();
		});
	});
	
	describe('#Statics', function () {
		//publish
		before( function () {
			doc.save(function(err) {
				assert.strictEqual(err, null, 'There should be no errors');
			});
		});
		
		it('Should publish the document', function (done) {
			assert.strictEqual(typeof MockSchema.statics.publishDocument, 'function', 'publishDocument method exists');
			MockModel.publishDocument(doc._id, function (err, result) {
				assert.strictEqual(err, null, 'There should be no errors thrown');
				assert.strictEqual(result.status, 1, 'Status of document strictly equals to 1');
				done();
			}); 
		});
		// unpublish
		it('Should un-publish the document', function (done) {
			assert.strictEqual(typeof MockSchema.statics.unPublishDocument, 'function', 'unPublishDocument method exists');
			MockModel.unPublishDocument(doc._id, function (err, result) {
				assert.strictEqual(err, null, 'There should be no errors thrown');
				assert.strictEqual(result.status, 0, 'Status of document strictly equals to 0');
				done();
			}); 
		});
		// Trash
		it('Should trash the document', function (done) {
			assert.strictEqual(typeof MockSchema.statics.trashDocument, 'function', 'trashDocument method exists');
			MockModel.trashDocument(doc._id, function (err, result) {
				assert.strictEqual(err, null, 'There should be no errors thrown');
				assert.strictEqual(result.status, 2, 'Status of document strictly equals to 2');
				done();
			}); 
		});
	});
});