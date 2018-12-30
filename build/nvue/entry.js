const fs = require('fs')
const path = require('path')
const glob = require('glob')

const entry = {}

const addEntry = function(page, source) {
  entry[page.replace('.nvue', '')] = path.resolve(source, page) + '?entry'
}
const removeEntry = function(page) {
  delete entry[page.replace('.nvue', '')]
}
const getEntry = function(source) {
  //查找页面
  glob.sync('./**/*.nvue', {
    nodir: true,
    cwd: source,
    ignore: ['./node_modules/**/*', './components/**/*']
  }).forEach(function(file) {
    addEntry(file, source)
  })
  return function() {
    return entry
  }
}

module.exports = {
  add: addEntry,
  get: getEntry,
  remove: removeEntry
}