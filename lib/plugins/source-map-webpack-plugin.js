const path = require('path')
const SourceMapConsumer = require('source-map').SourceMapConsumer
const SourceMapGenerator = require('source-map').SourceMapGenerator

function SourceMapWebpackPlugin(options) {
  this.include = options.include || function() {
    return true
  }
}

SourceMapWebpackPlugin.prototype.apply = function(compiler) {
  if(!compiler.options.devtool) {
    return
  }
  const rewrite = this.rewrite
  if(~compiler.options.devtool.indexOf('eval')) {
    compiler.plugin('compilation', function(compilation) {
      compilation.moduleTemplate.apply(new EvalSourceMapDevToolModuleTemplatePlugin(compilation, {
        substr: '//# sourceURL=UNIAPP_SOURCEMAP'
      }))
    })
  }

  compiler.plugin('emit', function(compilation, callback) {
    const assets = compilation.assets
    Object.keys(assets).forEach(asset => {
      switch(path.extname(asset)) {
        case '.map':
          rewrite(assets[asset])
          break
      }
    })
    callback()
  })
}

SourceMapWebpackPlugin.prototype.rewrite = function(rawSource) {
  const include = this.include
  const addMapping = this.addMapping
  const sourceContentCache = {}
  const consumer = new SourceMapConsumer(JSON.parse(rawSource.source()))
  const generator = new SourceMapGenerator({
    file: consumer.file,
    sourceRoot: consumer.sourceRoot
  })
  consumer.eachMapping(function(mapping) {
    let isInclude = false
    if(typeof include === 'function' && include(mapping.source)) {
      isInclude = true
    } else if(include instanceof RegExp) {
      isInclude = include.test(mapping.source)
    }
    if(isInclude) {
      addMapping(generator, mapping)
      if(!sourceContentCache[mapping.source]) {
        generator.setSourceContent(mapping.source, consumer.sourceContentFor(mapping.source))
        sourceContentCache[mapping.source] = true
      }
    }
  })
  rawSource._value = generator.toString()
}

SourceMapWebpackPlugin.prototype.addMapping = function(generator, mapping) {
  if(mapping.originalLine) {
    generator.addMapping({
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn
      },
      source: mapping.source,
      original: {
        line: mapping.originalLine,
        column: mapping.originalColumn
      },
      name: mapping.name
    })
  }
}

function EvalSourceMapDevToolModuleTemplatePlugin(compilation, options) {
  this.compilation = compilation

  options = options || {}
  this.substr = options.substr
  this.replacement = options.replacement || ''
}

EvalSourceMapDevToolModuleTemplatePlugin.prototype.apply = function(moduleTemplate) {
  const substr = this.substr
  const replacement = this.replacement
  if(substr) {
    moduleTemplate.plugin('render', function(source, module) {
      if(source instanceof require('webpack-sources').RawSource) {
        source._value = source.source().replace(substr, replacement)
      }
      return source
    })
  }
}
module.exports = SourceMapWebpackPlugin