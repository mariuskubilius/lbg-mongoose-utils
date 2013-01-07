//define connection
var mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGO_DB_URI || 'mongodb://localhost/mongoose_utils')

module.exports = {
  db: db
}

