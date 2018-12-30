const path = require('path')
const fs = require('fs')

const utils = require('loader-utils')

const isWin = /^win/.test(process.platform)
const normalizePath = path => isWin ? path.replace(/\\/g, '/') : path

const parsePagesJon = require('./parsePagesJson')

const config = require('../config')

const sourceRoot = config.build.sourceRoot

module.exports = function(content) {
  this.cacheable && this.cacheable()
  
  if(normalizePath(this.resourcePath) === normalizePath(path.resolve(sourceRoot, 'main.js'))) {

    const pagesJson = parsePagesJon()

    if(!pagesJson) {
      throw new Error('pages.json 解析失败')
    }

    let isFirst = true

    const pages = pagesJson.pages.map(page => {
      if(isFirst) {
        isFirst = false
        return '^' + page.path
      }
      return page.path
    })

    const appJson = {
      'pages': pages,
      'window': pagesJson.globalStyle,
      'tabBar': pagesJson.tabBar
    }

    if(config.isAppPlus && pagesJson.nvue) {
      appJson.nvue = pagesJson.nvue
    }

    return content + `
export default {config:${JSON.stringify(appJson)}}
`
  }
  return content
}