var path = require("path")

var preprocessorContext = require('../utils').preprocessorContext

function resolve(dir) {
    return path.join(__dirname, "../..", dir)
}

exports.cssLoaders = function(options) {
    options = options || {}
    const cssLoader = {
        loader: 'css-loader',
        options: {
            sourceMap: options.sourceMap
        }
    }

    var preprocessorLoader = {
        loader: resolve("lib/preprocessor-loader.js"),
        options: {
            type: "js",
            context: Object.assign({}, preprocessorContext, {
                'APP-PLUS-NVUE': true,
                'APP_PLUS_NVUE': true
            })
        }
    }

    const postcssLoader = {
        loader: 'postcss-loader',
        options: {
            sourceMap: options.sourceMap
        }
    }

    // generate loader string to be used with extract text plugin
    const generateLoaders = (loader, loaderOptions) => {
        let loaders = options.useVue ? [cssLoader] : []
        if (options.usePostCSS) {
            loaders.push(postcssLoader)
        }
        loaders.push(preprocessorLoader)
        if (loader) {
            loaders.push({
                loader: loader + '-loader',
                options: Object.assign({}, loaderOptions, {
                    sourceMap: options.sourceMap
                })
            })
        }
        if (options.useVue) {
            return ['vue-style-loader'].concat(loaders)
        } else {
            return loaders
        }
    }

    // https://vue-loader.vuejs.org/en/configurations/extract-css.html
    return {
        less: generateLoaders('less'),
        sass: generateLoaders('sass', {
            indentedSyntax: true
        }),
        scss: generateLoaders('sass'),
        stylus: generateLoaders('stylus'),
        styl: generateLoaders('stylus')
    }
}
