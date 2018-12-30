const path = require('path')

const config = require('../config')

const isWin = /^win/.test(process.platform)
const normalizePath = function(path) {
  return isWin ? path.replace(/\\/g, '/') : path
}

module.exports = function(content) {
  this.cacheable && this.cacheable()
  if(~normalizePath(this.resourcePath).indexOf(normalizePath(config.build.sourceRoot))) {
    return `const uni = require('uni').default;${content}`

  }
  return content
}