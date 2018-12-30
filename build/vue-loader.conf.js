var path = require('path')
var utils = require('./utils')
var config = require('../config')
var tsconfig = require('./tsconfig')
// var isProduction = process.env.NODE_ENV === 'production'
// for mp
var isProduction = true

module.exports = {
    loaders: Object.assign(utils.cssLoaders({
        sourceMap: isProduction ?
            config.build.productionSourceMap : config.dev.cssSourceMap,
        extract: isProduction
    }), {
        js: utils.babelLoader
    }),
    preserveWhitespace: false
    //  transformToRequire: {
    //      video: 'src',
    //      source: 'src',
    //      img: 'src',
    //      image: 'xlink:href'
    //  }

}
