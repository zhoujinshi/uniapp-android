const fs = require('fs')
const path = require('path')
const utils = require('./utils')

const babelLoader = require('../utils').babelLoader

const preprocessorContext = require('../utils').preprocessorContext

const isProduction = process.env.NODE_ENV === 'production'

const scriptLoader = path.resolve(__dirname, '../../node_modules/weex-vue-loader/lib/script-loader.js')

const resolve = (dir) => {
    return path.join(__dirname, '../..', dir)
}

const preprocessorLoader = resolve("lib/preprocessor-loader.js")

module.exports = (options) => {
    return {
        loaders: Object.assign(utils.cssLoaders({
            // sourceMap: use sourcemao or not.
            sourceMap: false,
            // useVue: use vue-style-loader or not
            useVue: false,
            // usePostCSS: use postcss to compile styles.
            usePostCSS: false
        }), {
            js: scriptLoader + '!' + babelLoader + '!' + preprocessorLoader + '?' + JSON.stringify({
                type: 'js',
                context: Object.assign({}, preprocessorContext, {
                    'APP-PLUS-NVUE': true,
                    'APP_PLUS_NVUE': true
                })
            })
        }),
        cssSourceMap: false,
        cacheBusting: false
    }
}
