/**
 * Mongoose extension implementing document publish status to document.
 * @author Marius Kubilius
 * @todo add methods and statics dealing with the tree.
 */

// require dependencies
var mongoose = require('mongoose');


status = function (schema) {
	var fields = {};
	if (!schema.paths.status) {
		fields.status = {
			type: Number,
			default: 0,
		};
	}
	schema.add(fields);
	
	schema.statics = {
		/**
		 * Publish document according to _id.
		 * @param {mongoid} [id] id of the document to be published
		 * @param {function} [cb] callback function
		 */
		publishDocument: function(id, cb) {
			this.findByIdAndUpdate(id, {status: 1})
			.exec(cb);
		},
		
		/**
		 * Un-Publish document according to _id.
		 * @param {mongoid} [id] id of the document to be published
		 * @param {function} [cb] callback function
		 */
		unPublishDocument: function(id, cb) {
			this.findByIdAndUpdate(id, {status: 0})
			.exec(cb);
		},
		
		/**
		 * Trash document according to _id.
		 * @param {mongoid} [id] id of the document to be published
		 * @param {function} [cb] callback function
		 */
		trashDocument: function(id, cb) {
			this.findByIdAndUpdate(id, {status: 2})
			.exec(cb);
		}
	}
}

module.exports = status;