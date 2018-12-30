var utils = require('./utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')

// var HtmlWebpackPlugin = require('html-webpack-plugin')

// copy from ./webpack.prod.conf.js
var path = require('path')

// add hot-reload related code to entry chunks
// Object.keys(baseWebpackConfig.entry).forEach(function (name) {
//   baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
// })

const output = {
    path: config.build.wxRoot,
    // filename: utils.assetsPath('js/[name].[chunkhash].js'),
    // chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
    filename: utils.assetsPath('[name].js'),
    chunkFilename: utils.assetsPath('[id].js')
}

if (config.isAppPlus) {
    // cheap-module-eval-source-map is faster for development
    // devtool: '#cheap-module-eval-source-map',
    baseWebpackConfig.devtool = 'eval'
    output.devtoolModuleFilenameTemplate = function (info) {
        const absoluteResourcePath = utils.normalizePath(info.absoluteResourcePath)
        const sourceRoot = utils.normalizePath(config.build.sourceRoot)
        if (~absoluteResourcePath.indexOf(sourceRoot)) {
            if (path.extname(absoluteResourcePath) === '.js' || ~info.allLoaders.indexOf(
                    '/lib/selector.js?type=script')) {
                return `${absoluteResourcePath.replace(sourceRoot, 'uni-app://')}?${info.hash}`
            }
        }
        return `UNIAPP_SOURCEMAP`
    }
}
if (config.isMPWeixin) {
    baseWebpackConfig.plugins.push(new webpack.SourceMapDevToolPlugin({
        filename: '../.sourcemap/'+process.env.TARGET.toLowerCase()+'/[name].js.map'
    }))
}

module.exports = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({
            sourceMap: config.dev.cssSourceMap,
            extract: true
        })
    },
    output: output,
    plugins: [
        new webpack.DefinePlugin({
            'process.env': config.dev.env
        })
    ],
	stats: 'none'
})
