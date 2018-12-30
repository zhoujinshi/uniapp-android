const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const util = require('../utils')
const AssetsPlugin = require('../../lib/plugins/assets-webpack-plugin')
const SourcemapPlugin = require('../../lib/plugins/source-map-webpack-plugin')
const UniAppErrorsPlugin = require("../../lib/plugins/uniapp-errors-webpack-plugin")

var formatErrors = require("../formatErrors")

const config = require('../../config')
const vueLoaderConfig = require('./vue-loader.conf')

const resolve = (dir) => {
    return path.join(__dirname, '../..', dir)
}


const preprocessorLoader = resolve("lib/preprocessor-loader.js")

const jsPreprocessorLoader = {
    loader: preprocessorLoader,
    options: {
        type: "js",
        context: Object.assign({}, util.preprocessorContext, {
            'APP-PLUS-NVUE': true,
            'APP_PLUS_NVUE': true
        })
    }
}

const sourceRoot = config.build.sourceRoot
let isFirst = true
module.exports = function(pages) {
    const entry = {}
    Object.keys(pages).forEach(pagePath => {
        entry[pagePath.replace('.html', '')] = path.resolve(sourceRoot, pagePath.replace('.html', '.nvue')) +
            '?entry'
    })
    return {
        entry,
        output: {
            path: path.resolve(config.build.plusRoot, path.basename(config.build.sourceRoot) || 'HBuilderProject'),
            filename: '[name].js?[chunkhash]',
            //       devtoolModuleFilenameTemplate: function(info) {
            //         const substr = info.resourcePath.substr(0, info.resourcePath.indexOf('/'))
            //         if(~info.allLoaders.indexOf('/lib/selector.js?type=script')) {
            //           return `${info.resourcePath.replace(substr,'uni-app://')}?${info.hash}`
            //         } else {
            //           return `${info.resourcePath.replace(substr,'webpack')}?${info.hash}`
            //         }
            //       }
        },
        /**
         * Options affecting the resolving of modules.
         * See http://webpack.github.io/docs/configuration.html#resolve
         */
        resolve: {
            extensions: ['.js', '.nvue', '.vue', '.json'],
            alias: {
                '@': path.resolve(sourceRoot)
                // 'uni': resolve('lib/uni.nvue.js')
            },
            modules: [config.build.sourceRoot, path.join(config.build.sourceRoot, 'node_modules'), resolve("lib"),
                resolve(
                    "node_modules")
            ],
        },
        /*
         * Options affecting the resolving of modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {
            rules: [{
                    test: /\.js$/,
                    use: [{
                        loader: resolve('node_modules/babel-loader')
                    }, jsPreprocessorLoader],
                    exclude: /node_modules(?!(\/|\\).*(weex).*)/
                },
                {
                    test: /\.nvue(\?[^?]+)?$/,
                    use: [{
                        loader: resolve('node_modules/weex-vue-loader'),
                        options: vueLoaderConfig()
                    }],
                    exclude: /node_modules(?!(\/|\\).*(weex).*)/
                },
                {
                    test: /\.vue(\?[^?]+)?$/,
                    use: [{
                        loader: resolve('node_modules/weex-vue-loader'),
                        options: vueLoaderConfig()
                    }],
                    exclude: /node_modules(?!(\/|\\).*(weex).*)/
                }
            ]
        },
        /*
         * Add additional plugins to the compiler.
         *
         * See: http://webpack.github.io/docs/configuration.html#plugins
         */
        plugins: [
            /*
             * Plugin: BannerPlugin
             * Description: Adds a banner to the top of each generated chunk.
             * See: https://webpack.js.org/plugins/banner-plugin/
             */
            //  new UglifyJsPlugin({
            //    //     sourceMap: true
            //  }),
            new webpack.BannerPlugin({
                banner: '// { "framework": "Vue"} \n',
                raw: true,
                exclude: 'Vue'
            }),
            new AssetsPlugin({
                afterEmit: function(asset) {
                    // util.info('写入', asset.split('?')[0])
                }
            }),
            new webpack.ProvidePlugin({
                'uni': [resolve('lib/uni.nvue.js'), 'default']
            }),
            //       new SourcemapPlugin({
            //         include: /uni-app:\/\//
            //       }),
            // new webpack.NoEmitOnErrorsPlugin(),
            new UniAppErrorsPlugin({
                onErrors(errors) {
                    console.log(errors)
                    console.error(
                        Array.from(
                            new Set(
                                errors.map(err => {
                                    const formatError = formatErrors[err.name]

                                    if (formatError) {
                                        const result = formatError(err)
                                        if (result) {
                                            if (typeof result === "string") {
                                                return result
                                            } else {
                                                return (
                                                    result.message +
                                                    " at " +
                                                    path.relative(
                                                        config.build.sourceRoot,
                                                        err.module.resource
                                                    ) +
                                                    ":" +
                                                    (result.line || 1)
                                                )
                                            }
                                        } else if (result === false) {
                                            return "" //skip
                                        }
                                    }
                                    return err.message
                                })
                            )
                        )
                        .filter(msg => !!msg)
                        .join("\n")
                    )
                }
            }),
            function() {
                this.plugin('done', function() {
                    if (isFirst) {
                        isFirst = false
                    } else {
                        console.log('***NVUE DONE***')
                    }
                })
            }
        ],
        stats: {
            reasons: true,
            errorDetails: true
        },
        /*
         * Include polyfills or mocks for various node stuff
         * Description: Node configuration
         *
         * See: https://webpack.github.io/docs/configuration.html#node
         */
        node: {
            global: false,
            Buffer: false,
            __filename: false,
            __dirname: false,
            setImmediate: false,
            clearImmediate: false,
            // see: https://github.com/webpack/node-libs-browser
            assert: false,
            buffer: false,
            child_process: false,
            cluster: false,
            console: false,
            constants: false,
            crypto: false,
            dgram: false,
            dns: false,
            domain: false,
            events: false,
            fs: false,
            http: false,
            https: false,
            module: false,
            net: false,
            os: false,
            path: false,
            process: false,
            punycode: false,
            querystring: false,
            readline: false,
            repl: false,
            stream: false,
            string_decoder: false,
            sys: false,
            timers: false,
            tls: false,
            tty: false,
            url: false,
            util: false,
            vm: false,
            zlib: false
        }

    }
}
