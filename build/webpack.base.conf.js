var fs = require("fs")
var path = require("path")
var webpack = require("webpack")
var merge = require("webpack-merge")
var stripJsonComments = require("strip-json-comments")
var UglifyJsPlugin = require("uglifyjs-webpack-plugin")
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var CopyWebpackPlugin = require("copy-webpack-plugin")
// var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

var utils = require("./utils")

var config = require("../config")
var tsconfig = require("./tsconfig")
var vueLoaderConfig = require("./vue-loader.conf")
var MpvuePlugin = require("../lib/webpack-mpvue-asset-plugin")
var UniAppErrorsPlugin = require("../lib/plugins/uniapp-errors-webpack-plugin")
var SourcemapPlugin = require("../lib/plugins/source-map-webpack-plugin")

var getEntry = require("./getEntry")
var parsePagesJson = require("../lib/parsePagesJson")

var formatErrors = require("./formatErrors")

function resolve(dir) {
	return path.join(__dirname, "..", dir)
}

//TODO 生成 tsconfig.json

let isFirst = true

const {
	entry,
	virtualModulesPlugin
} = getEntry(config.build.sourceRoot)

const preprocessorLoader = resolve("lib/preprocessor-loader.js")


const jsPreprocessorLoader = {
	loader: preprocessorLoader,
	options: {
		type: "js",
		context: utils.preprocessorContext
	}
}

const getPagesJson = function() {
	let pagesJson = {}
	try {
		pagesJson = JSON.parse(
			stripJsonComments(
				fs.readFileSync(path.resolve(config.build.sourceRoot, "pages.json"), "utf8")
			)
		)
	} catch (e) {}
	return pagesJson
}

const getCondition = function(pagesJson) {
	const launchPagePath = process.env.UNI_CLI_LAUNCH_PAGE_PATH || ''
	const launchPageQuery = process.env.UNI_CLI_LAUNCH_PAGE_QUERY || ''

	const launchPageOptions = {
		"id": 0,
		"name": launchPagePath, //模式名称
		"pathName": launchPagePath, //启动页面，必选
		"query": launchPageQuery //启动参数，在页面的onLoad函数里面得到。
	}
	if (pagesJson.condition) {
		let current = -1
		if (Array.isArray(pagesJson.condition.list) && pagesJson.condition.list.length) {
			pagesJson.condition.list.forEach(function(item, index) {
				item.id = item.id || index
				if (item.path) {
					item.pathName = item.path
					delete item.path
				}
				if (launchPagePath) {
					if (item.pathName === launchPagePath && item.query === launchPageQuery) { //指定了入口页
						current = index
					}
				}
			})
			if (launchPagePath) {
				if (current !== -1) { //已存在
					pagesJson.condition.current = current
				} else { //不存在
					pagesJson.condition.list.push(Object.assign(launchPageOptions, {
						id: pagesJson.condition.list.length
					}))
					pagesJson.condition.current = pagesJson.condition.list.length - 1
				}
			}
			return pagesJson.condition
		}
	}
	if (launchPagePath) {
		return {
			"current": 0,
			"list": [launchPageOptions]
		}
	}
	return false
}

//CopyWebpackPlugin在部分电脑上不触发 copy？
const copyProjectConfigJson = function() {
	const content = fs.readFileSync(path.resolve(__dirname, "../lib/project.config.json"), "utf8")
	const manifestJson = utils.parseManifestJson()
	if (!manifestJson) {
		throw new Error("manifest.json 解析失败")
	}
	const pagesJson = getPagesJson()

	let projectConfigJson = JSON.parse(content)
	if (manifestJson["mp-weixin"]) {
		projectConfigJson = merge(projectConfigJson, manifestJson["mp-weixin"])
		if (!(projectConfigJson.appid + "").trim()) {
			projectConfigJson.appid = "touristappid"
		}
		delete projectConfigJson.functionalPages
		delete projectConfigJson.requiredBackgroundModes
		delete projectConfigJson.plugins
		delete projectConfigJson.resizable
        delete projectConfigJson.permission
	}
	if (projectConfigJson.projectname === "{NAME}") {
		projectConfigJson.projectname = manifestJson.name
	}

	const condition = getCondition(pagesJson)
	if (condition) {
		projectConfigJson.condition.miniprogram = condition
	}
	const wxcomponentsPath = path.resolve(config.build.sourceRoot, "./wxcomponents")
	if (fs.existsSync(wxcomponentsPath)) { //引用了原生小程序组件，自动开启 ES6=>ES5
		const wxcomponentsFiles = fs.readdirSync(wxcomponentsPath)
		if (wxcomponentsFiles.length) {
			projectConfigJson.setting.es6 = true
		}
	}

	fs.writeFileSync(
		path.resolve(config.build.wxRoot, "./project.config.json"),
		JSON.stringify(projectConfigJson)
	)
}

function getPlatforms() {
	return [
		'app-plus',
		'mp-weixin'
	]
}

const ignore = []

getPlatforms().forEach(platform => {
	if (process.env.TARGET !== platform) {
		ignore.push(platform + '/**/*')
	}
})

const plugins = [
	// new webpack.ProgressPlugin(),
	new webpack.ProvidePlugin({
		'uni': [resolve("lib/uni." + process.env.TARGET + ".js"), 'default']
	}),
	virtualModulesPlugin,
	new MpvuePlugin(),
	new webpack.NoEmitOnErrorsPlugin(),
	new UniAppErrorsPlugin({
		onErrors(errors) {
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
												(err.module.issuer && err.module.issuer.resource) || err.module.resource
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
	//     new FriendlyErrorsPlugin({
	//         sourceRoot: config.build.sourceRoot,
	//         clearConsole: false,
	//         compilationSuccessLog: false,
	//         onErrors(severity, errors) {
	//             if (errors && errors.length) {
	//                 if (severity === 'error') {
	//                     utils.error(utils.formatErrors(errors).join('\n'))
	//                 } else if (severity === 'warn') {
	//                     utils.warn(utils.formatWarns(errors).join('\n'))
	//                 }
	//             }
	//         }
	//     }),
	new ExtractTextPlugin({
		// filename: utils.assetsPath('css/[name].[contenthash].css')
		filename: utils.assetsPath("[name].wxss")
	}),
	//     new OptimizeCSSPlugin({
	//         cssProcessorOptions: {
	//             safe: true
	//         }
	//     }),
	new webpack.optimize.CommonsChunkPlugin({
		name: "common/vendor",
		minChunks: function(module, count) {
			// any required modules inside node_modules are extracted to vendor
			return (
				(module.resource &&
					/\.js$/.test(module.resource) &&
					module.resource.indexOf("node_modules") >= 0) ||
				count > 1
			)
		}
	}),
	new webpack.optimize.CommonsChunkPlugin({
		name: "common/manifest",
		chunks: ["common/vendor"]
	}),
	// copy custom static assets
	new CopyWebpackPlugin([{
		from: path.resolve(config.build.sourceRoot, "./static"),
		to: "static",
		ignore
	}]),

	function() {
		this.plugin("invalid", function() {
			utils.info("编译", "Compiling...")
		})
		this.plugin("done", function(stats) {
			utils.writeAppAndPageJson(parsePagesJson(), utils.parseManifestJson())
			if (!stats.hasErrors()) {
				isFirst = false
				if (config.isMPWeixin) {
					copyProjectConfigJson()
					utils.success("完成", "微信小程序 编译完毕")
					console.log("***MP-WEIXIN DONE***")
					if (process.env.NODE_ENV === 'production') {
						process.exit(0)
					}
				}
				if (config.isAppPlus) {
					const pagesJson = process.env.NODE_ENV === "development" ? getPagesJson() : {} //仅开发模式生效
					var wxmp = require("../lib/weapp-tools/lib")(
						config.build.wxRoot,
						config.build.plusRoot,
						path.basename(config.build.sourceRoot),
						function() {
							if (process.env.NODE_ENV === 'production') {
								// process.exit(0)
							}
						}, {
							condition: getCondition(pagesJson) || {}
						}
					)
				}
			} else {
				if (isFirst) {
					process.exit(1)
				}
				isFirst = false
			}
		})
	}
]
if (config.isMPWeixin) {
	plugins.push(
		new UglifyJsPlugin({
			sourceMap: true,
			uglifyOptions: {
				compress: {
					drop_debugger: false
				}
			}
		})
	)
}
if (config.isAppPlus) {
	plugins.push(
		new SourcemapPlugin({
			include: /uni-app:\/\//
		})
	)
	plugins.push(
		new CopyWebpackPlugin([{
			from: path.resolve(config.build.sourceRoot, "manifest.json"),
			to: path.resolve(config.build.wxRoot, "manifest.json")
		}])
	)
	//5+ htmls
	if (fs.existsSync(path.resolve(config.build.sourceRoot, "./hybrid/html"))) {
		plugins.push(
			new CopyWebpackPlugin([{
				from: path.resolve(config.build.sourceRoot, "./hybrid/html"),
				to: path.resolve(config.build.plusRoot, path.basename(config.build.sourceRoot), "./hybrid/html"),
				ignore: [".*"]
			}]),
		)
	}
}

if (fs.existsSync(path.resolve(config.build.sourceRoot, "./wxcomponents"))) {
	plugins.push(
		new CopyWebpackPlugin([{
			from: path.resolve(config.build.sourceRoot, "./wxcomponents"),
			to: "wxcomponents",
			ignore: [".*"]
		}]),
	)
}



Object.assign(vueLoaderConfig.loaders, {
	ts: [
		//添加对应vue的loader
		utils.babelLoader,
		{
			loader: resolve("node_modules/awesome-typescript-loader"),
			options: {
				configFileContent: tsconfig,
				useCache: true
			}
		},
		jsPreprocessorLoader
	]
})
module.exports = {
	// 如果要自定义生成的 dist 目录里面的文件路径，
	// 可以将 entry 写成 {'toPath': 'fromPath'} 的形式，
	// toPath 为相对于 dist 的路径, 例：index/demo，则生成的文件地址为 dist/index/demo.js
	entry,
	target: require("mpvue-webpack-target"),
	output: {
		filename: "[name].js",
		publicPath: process.env.NODE_ENV === "production" ?
			config.build.assetsPublicPath : config.dev.assetsPublicPath
	},
	resolve: {
		extensions: [".js", ".vue", ".json", ".ts", ".tsx"],
		alias: {
			vue: resolve("lib/mpvue"),
			"@": config.build.sourceRoot,
			vuex: resolve("node_modules/vuex"),
			flyio: resolve("node_modules/flyio")
		},
		modules: [config.build.sourceRoot, path.join(config.build.sourceRoot, 'node_modules'), resolve("lib"), resolve(
			"node_modules")],
		symlinks: false
	},
	module: {
		rules: [{
				test: /\.vue$/,
				include: [config.build.sourceRoot], //目前仅处理用户工程下的
				exclude: /node_modules\/.*(weex).*/,
				use: [{
					loader: resolve("lib/mpvue-loader"),
					options: Object.assign(vueLoaderConfig, {
						sourceRoot: config.build.sourceRoot,
						globalBabelrc: resolve(".babelrc"),
						preLoaders: {
							js: preprocessorLoader +
								"?" +
								JSON.stringify({
									type: "js",
									context: utils.preprocessorContext
								}),
							html: preprocessorLoader +
								"?" +
								JSON.stringify({
									type: "html",
									context: utils.preprocessorContext
								}),
							css: preprocessorLoader +
								"?" +
								JSON.stringify({
									type: "js",
									context: utils.preprocessorContext
								})
						}
					})
				}]
			},
			{
				test: /\.js$/,
				include: [
					config.build.sourceRoot,
					resolve("lib/mpvue-page-factory/index.js"),
					resolve("lib/uni." + process.env.TARGET + ".js")
				],
				use: [
					utils.babelLoader,
					{
						loader: resolve("lib/mpvue-loader"),
						options: {
							checkMPEntry: true
						}
					},
					jsPreprocessorLoader
				]
			},
			{
				test: /\.tsx?$/,
				// include: [resolve('src'), resolve('test')],
				include: [
					config.build.sourceRoot,
					resolve("lib/uni." + process.env.TARGET + ".js")
				],
				use: [
					utils.babelLoader,
					{
						loader: resolve("lib/mpvue-loader"),
						options: {
							checkMPEntry: true
						}
					},
					{
						loader: resolve("node_modules/awesome-typescript-loader"),
						options: {
							configFileContent: tsconfig,
							useCache: true
						}
					},
					jsPreprocessorLoader
				]
			}
			//             {
			//                 test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
			//                 loader: resolve('node_modules/url-loader'),
			// 				include: [config.build.sourceRoot],//目前仅处理用户工程下的
			//                 options: {
			//                     limit: 10000,
			//                     name: utils.assetsPath('img/[name].[ext]')
			//                 }
			//             },
			//             {
			//                 test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
			//                 loader: resolve('node_modules/url-loader'),
			// 				include: [config.build.sourceRoot],//目前仅处理用户工程下的
			//                 options: {
			//                     limit: 10000,
			//                     name: utils.assetsPath('media/[name]].[ext]')
			//                 }
			//             },
			//             {
			//                 test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
			//                 loader: resolve('node_modules/url-loader'),
			// 				include: [config.build.sourceRoot],//目前仅处理用户工程下的
			//                 options: {
			//                     limit: 10000,
			//                     name: utils.assetsPath('fonts/[name].[ext]')
			//                 }
			//             }
		]
	},
	plugins: plugins
}
