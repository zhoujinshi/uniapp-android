var utils = require('./utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var UglifyJsPlugin = require('uglifyjs-webpack-plugin')
var baseWebpackConfig = require('./webpack.base.conf')

var env = config.build.env

var webpackConfig = merge(baseWebpackConfig, {
	module: {
		rules: utils.styleLoaders({
			sourceMap: config.build.productionSourceMap,
			extract: true
		})
	},
	devtool: config.build.productionSourceMap ? '#source-map' : false,
	output: {
		path: config.build.wxRoot,
		// filename: utils.assetsPath('js/[name].[chunkhash].js'),
		// chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
		filename: utils.assetsPath('[name].js'),
		chunkFilename: utils.assetsPath('[id].js')
	},
	stats: {
		errors: true,
		// Add details to errors (like resolving log)
		errorDetails: true,
	},
	plugins: [
		new UglifyJsPlugin({
			sourceMap: false
		}),
		// http://vuejs.github.io/vue-loader/en/workflow/production.html
		new webpack.DefinePlugin({
			'process.env': env
		}),
		// keep module.id stable when vender modules does not change
		// new webpack.HashedModuleIdsPlugin(),
	]
})

// if (config.build.productionGzip) {
//   var CompressionWebpackPlugin = require('compression-webpack-plugin')

//   webpackConfig.plugins.push(
//     new CompressionWebpackPlugin({
//       asset: '[path].gz[query]',
//       algorithm: 'gzip',
//       test: new RegExp(
//         '\\.(' +
//         config.build.productionGzipExtensions.join('|') +
//         ')$'
//       ),
//       threshold: 10240,
//       minRatio: 0.8
//     })
//   )
// }

if (config.build.bundleAnalyzerReport) {
	var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
	webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
