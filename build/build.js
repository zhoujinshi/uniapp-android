require('module-alias/register')
require('./check-versions')()

process.env.NODE_ENV = 'production'

var fs = require('fs')
var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
var webpack = require('webpack')

var utils = require('./utils')
var config = require('../config')
var webpackConfig = require('./webpack.prod.conf')

var webpackConfigs = [webpackConfig]

var webpackNVueConfig = utils.getWebpackNVueConfig()

if(webpackNVueConfig) {
  webpackConfigs.unshift(webpackNVueConfig)
}

var spinner = ora('building for production...')
spinner.start()
rm(path.join(config.build.wxRoot, config.build.assetsSubDirectory), err => {
  if(err) throw err
  webpack(webpackConfigs, function(err, stats) {
    spinner.stop()
    if(err) throw err
//      process.stdout.write(stats.toString({
//        colors: true,
//        modules: false,
//        children: false,
//        chunks: false,
//        chunkModules: false,
// 			 reasons: true,
// 			 errorDetails: true
//      }) + '\n\n')
    if(stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    //     console.log(chalk.cyan('  Build complete.\n'))
    //     console.log(chalk.yellow(
    //       '  Tip: built files are meant to be served over an HTTP server.\n' +
    //       '  Opening index.html over file:// won\'t work.\n'
    //     ))
  })
})