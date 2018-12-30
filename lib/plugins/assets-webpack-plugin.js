function AssetsWebpackPlugin(options) {
  this.afterEmit = options.afterEmit || function(asset) {
    console.log(asset)
  }
}
let lastAssets = false
AssetsWebpackPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    const assets = Object.keys(compilation.assets)
    if(!lastAssets) {
      lastAssets = assets
    } else {
      lastAssets.forEach(asset => {
        if(~assets.indexOf(asset)) {
          delete compilation.assets[asset]
        }
      })
      lastAssets = assets
    }
    callback()
  })
  const afterEmit = this.afterEmit
  compiler.plugin('after-emit', function(compilation, callback) {
    const assets = Object.keys(compilation.assets)
    assets.forEach(afterEmit)
    callback()
  })

}

module.exports = AssetsWebpackPlugin