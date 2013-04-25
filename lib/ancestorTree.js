/**
 * Mongoose extension implementing ancestor tree as defined in the link below.
 * @url http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-ancestors-array/
 * @author Marius Kubilius
 * @todo add methods and statics dealing with the tree.
 */
var Mongoose = require('mongoose');
var ObjectId = Mongoose.Schema.ObjectId;


ancestorTree = function(schema){

  var fields = {};
  if (!schema.paths.parent) {
    fields.parent = {
      type: ObjectId,
      set : function(val) {
        if(typeof(val) === "object" && val._id) {
          return val._id;
        }
        if(val === '') { return undefined}
        return val;
        
      },
      index: true
    }
  }
  
  if (!schema.paths.ancestors) {
    fields.ancestors = [{type: ObjectId, index: true}];
  }
    
  schema.add(fields);
  
  var createAncestors = function(ancestors, parent) {
    return ancestors.push(parent);
  }
  
  schema.pre('save', function (next) {
    var parentModified = this.isDirectModified('parent');
    var self = this;
    
  	if (self.isNew || parentModified) {
  	  if(!self.parent && self.isNew){
  	    return next();
  	  }
  	  self.collection.findOne({ _id : self.parent }, function(err, doc) {
        if(err) return next(err);
        var oldAncestorsLength = self.ancestors.length;
        if(doc) {
          self.ancestors = doc.ancestors;
		  // @todo find atomic operation for that.
		  self.ancestors.nonAtomicPush(self.parent);
		  //self.markModified('ancestors');
        }
        else {
          self.ancestors = [];
          self.markModified('ancestors');
        }
        if(!self.isNew && parentModified){
          
          self.collection.find({ ancestors : self._id }, function(err, cursor) {
            if(err) return next(err);
            var stream = cursor.stream();
            stream.on('data', function (doc) {
              //console.log(self.ancestors.concat(doc.ancestors.slice(oldAncestorsLength)));
              var newPath = self.ancestors.concat(doc.ancestors.slice(oldAncestorsLength));
              self.collection.update({ _id : doc._id }, { $set : { ancestors : newPath } }, function(err){
                if(err) return next();
              });
            });
            stream.on('close', function() {
              next();
            });
            stream.on('error', function(err) {
              next(err);
            });
          });
        }
        else{
          next();
        }
      });
  	}
  	else{
  	  next();
  	}
  });
  
  schema.pre('remove', function(next){
    this.collection.count({ancestors: this._id},function(err, count){
      if(err) return next(err);
      if(count > 0 ){
        return next(new Error('Please delete/move all children before proceeding'));
      }
      else {
        return next();
      }
    });    
  });
  
  schema.method('findDirectChildren', function(opts, cb) {
    if(arguments.length === 1 && typeof arguments[0] === 'function'){
      cb = opts;
      opts = {};
    }
    opts = opts || {};
    fields = opts.fields || {title: 1, slug: 1};
    return this.model(this.constructor.modelName).find({parent: this._id}, fields, cb);
  });

  schema.method('findChildren', function(opts, cb) {
    if(arguments.length === 1 && typeof arguments[0] === 'function'){
      cb = opts;
      opts = {};
    }
    opts = opts || {};
    fields = opts.fields || {title: 1, slug: 1};
    return this.model(this.constructor.modelName).find({ancestors: this._id}, fields, cb);
  });

  schema.method('getAncestors', function(opts, cb) {
    if(arguments.length === 1 && typeof arguments[0] === 'function'){
      cb = opts;
      opts = {};
    }
    opts = opts || {};
    fields = opts.fields || {title: 1, slug: 1};
    return this.model(this.constructor.modelName).find({_id: {$in: this.ancestors}}, fields, cb);
  });
  
  /**
   * Static Methods for schema
   */
  schema.statics = {

  /**
   * Find direct children
   * @param {ObjectId} [id] _id of parent item, or null if no parent exists.
   * @param {Object} [options] pass options here
   * @param {Function} [cb] Callback function.
   */
    directChildren: function (parent, options, cb) {
      if(arguments.length === 2 && typeof arguments[1] === 'function'){
        cb = options;
        options = {};
      }
      options.fields = options.fields || {'title':1, 'slug':1};
      options.sort = options.sort || {'title': 1};
      this.find({parent: parent})
      .sort(options.sort)
      .select(options.fields)
      .exec(cb)
    },

  /**
   * Find all children _ids and return them as an array
   * @param {ObjectId} [current] items _id which children you are looking.
   */
    childrenIdArray: function (current, cb) {
      var nodes = [current];
      this.find({ancestors: current})
      .select('_id')
      .stream()
      .on('data', function(doc){
        nodes.push(doc._id)
      })
      .on('error', function(err){
        cb(err, nodes);
      })
      .on('close', function() {
        cb(null, nodes)
      });
    }
}

  
};
/**
 * @todo write tests for statics.
 */


module.exports = ancestorTree;
