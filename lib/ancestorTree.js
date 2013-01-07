/**
 * Mongoose extension implementing ancestor tree as defined in the link below.
 * @url http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-ancestors-array/
 * @author Marius Kubilius
 * @todo add methods and statics dealing with the tree.
 */
var ObjectId = require('mongoose').Schema.ObjectId;

ancestorTree = function(schema){

  var fields = {};
  if (!schema.paths.parent) {
    fields.parent = {
      type: ObjectId, 
      set : function(val) {
        if(typeof(val) === "object" && val._id) {
          return val._id;
        }
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
}

module.exports = ancestorTree;
