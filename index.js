require('directory')(__dirname + '/lib/', function (fn, filename) {
  module.exports[filename] = fn
})
