const path = require('path')
const chokidar = require('chokidar')
const webpack = require('webpack')

const entry = require('./entry')

const webpackConfig = require('./webpack.nvue.conf')([])

if(process.argv.length < 4) {
  throw new Error('参数不正确')
}
const source = path.resolve(process.argv[2])
const dest = path.resolve(process.argv[3])
webpackConfig.entry = entry.get(source)
webpackConfig.devtool = process.env.NODE_ENV === 'development' ? '#source-map' : ''
webpackConfig.output = {
  path: dest,
  filename: '[name].js?[chunkhash]'
}

const compiler = webpack(webpackConfig)

if(process.env.NODE_ENV === 'development') {
  //webpackConfig['info-verbosity']='verbose'
  //https://github.com/webpack/watchpack/issues/25
  const timefix = 11000
  compiler.plugin('watch-run', function(watching, callback) {
    watching.startTime += timefix
    callback()
  })
  //compiler.plugin('invalid', function(fileName, changeTime) {
  //  console.log(fileName + ':' + changeTime)
  //})
  compiler.plugin('done', (stats) => {
    stats.startTime -= timefix
  })

  const watching = compiler.watch({}, function(err, stats) {
    if(err) throw err
    if(stats.hasErrors()) {
      console.log('Build failed with errors.\n')
      process.exit(1)
    }
  })
  chokidar.watch(source, {
    ignored: './node_modules/**/*',
    ignoreInitial: true,
    cwd: source
  }).on('add', function(filename, stats) {
    if(~filename.indexOf('.nvue') && filename.indexOf('components/') !== 0) {
      entry.add('./' + filename, source)
      watching.invalidate()
    }
  }).on('unlink', function(filename, stats) {
    entry.remove('./' + filename)
    watching.invalidate()
  })
} else {
  compiler.run(function(err, stats) {
    if(err) throw err
    console.log('***NVUE DONE***')
    if(stats.hasErrors()) {
      console.log('Build failed with errors.\n')
      process.exit(1)
    }
  })
}