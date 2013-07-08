# lbg-mongoose-utils #
A small collection of mongoose extensions to be used in my projects.
# Current modules: #
## slugify ## 
creates unique slugs for assigned items.
## ancestorTree ## 
helps maintaining hierarchical items.
use array of ancestors pattern can be seen here: 
http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-ancestors-array/

## status ##
adds status field and adds static methods: 
	* publishDocument, 
	* unPublishDocument 
	* trashDocument. 
### usage of status module: ### 
    model.publishDocument(id, function(err, result) {
    	console.log(result)
    });


