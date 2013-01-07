/**
 * Mongoose extension which makes sure that the slugs are unique no matter what.
 * Has minimum configuration operations, as it is suposed to be used for in house
 * developement. 
 * @author Marius Kubilius <marius.kubilius@gmail.com>
 * @param schema
 * @todo add lithuanian accents.
 */
slugify = function(schema) {
  
  //define defaults
  var fr = 'àáâãäåçèéêëìíîïñðóòôõöøùúûüýÿ' // Accent chars to find
  var to = 'aaaaaaceeeeiiiinooooooouuuuyy' // Accent replacement
  var fields = {};

  //if not defined define schema for title and slug.
  
  if (!schema.paths.slug) {
    fields.slug = {
      type: String
    , index:{unique: true, sparse: true}
    }
  }
  
  if (!schema.paths.title) {
    fields.title = String;
  }
  
  schema.add(fields);
  
  ['static', 'method'].forEach(function (method) {
    schema[method]('slugify', function (str) {
      str = str
      	.replace(/^\s+|\s+$/g, '')
      	.toLowerCase();
      
      //replace all illegal characters and accents
      for (var i=0; i<fr.length; i++) {
        str = str.replace(new RegExp(fr.charAt(i), 'g'), to.charAt(i));
      }
      return str
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-');
    })
  })
  
  // pre save check whether slug is modified ;)
  // Extract the slug on save, optionally overriding a previous value
  schema.pre('save', function (next) {
    var self = this;
    var slugChanged = self.isDirectModified('slug');
    //check for duplicated slugs.
    var checkDupes  = function(self, oldSlug, i){
	  self.collection.count({slug: self.slug}, function(err, count) {
        if (err) return next(err);
        if(count > 0) {
          self.slug = oldSlug + '-' + i;
          i++
          checkDupes(self, oldSlug, i);
        }
        else {
          next();
        }
      });
    }
    if (slugChanged) {
      self.slug = self.slugify(self.slug);
      checkDupes(self, self.slug, 1);
    }
    if (!self.slug) {
      self.slug = self.slugify(self.title);
      checkDupes(self, self.slug, 1);
    }
    else {
      next();
    }
    

  });
  


}

module.exports = slugify;

