var fs = require("fs")
var path = require("path")
var chalk = require("chalk")
var shell = require("shelljs")

var stripJsonComments = require("strip-json-comments")

var config = require("../config")

var ExtractTextPlugin = require("extract-text-webpack-plugin")

var parsePagesJson = require("../lib/parsePagesJson")

const SCSS =
	`/**
 * 这里是uni-app内置的常用样式变量
 *
 * uni-app 插件市场（https://ext.dcloud.net.cn）上很多插件使用了这些样式变量，你可以通过修改这些变量值来定制自己的插件主题
 * 
 *如果你的项目同样使用了scss预处理，你可以直接在你的 scss 代码中使用如下变量，同时无需 import 这个文件
 *
 */

/* 颜色变量 */

/* 行为相关颜色 */
$uni-color-primary: #007aff;
$uni-color-success: #4cd964;
$uni-color-warning: #f0ad4e;
$uni-color-error: #dd524d;

/* 文字基本颜色 */
$uni-text-color:#333;//基本色
$uni-text-color-inverse:#fff;//反色
$uni-text-color-grey:#999;//辅助灰色，如加载更多的提示信息
$uni-text-color-placeholder: #808080;
$uni-text-color-disable:#c0c0c0;

/* 背景颜色 */
$uni-bg-color:#ffffff;
$uni-bg-color-grey:#f8f8f8;
$uni-bg-color-hover:#f1f1f1;//点击状态颜色
$uni-bg-color-mask:rgba(0, 0, 0, 0.4);//遮罩颜色

/* 边框颜色 */
$uni-border-color:#c8c7cc;

/* 尺寸变量 */

/* 文字尺寸 */
$uni-font-size-sm:24upx;
$uni-font-size-base:28upx;
$uni-font-size-lg:32upx;

/* 图片尺寸 */
$uni-img-size-sm:40upx;
$uni-img-size-base:52upx;
$uni-img-size-lg:80upx;

/* Border Radius */
$uni-border-radius-sm: 4upx;
$uni-border-radius-base: 6upx;
$uni-border-radius-lg: 12upx;
$uni-border-radius-circle: 50%;

/* 水平间距 */
$uni-spacing-row-sm: 10px;
$uni-spacing-row-base: 20upx;
$uni-spacing-row-lg: 30upx;

/* 垂直间距 */
$uni-spacing-col-sm: 8upx;
$uni-spacing-col-base: 16upx;
$uni-spacing-col-lg: 24upx;

/* 透明度 */
$uni-opacity-disabled: 0.3; // 组件禁用态的透明度

/* 文章场景相关 */
$uni-color-title: #2C405A; // 文章标题颜色
$uni-font-size-title:40upx;
$uni-color-subtitle: #555555; // 二级标题颜色
$uni-font-size-subtitle:36upx;
$uni-color-paragraph: #3F536E; // 文章段落颜色
$uni-font-size-paragraph:30upx;
`

const PLATFORMS = [
	'h5',
	'app-plus',
	'mp-weixin',
	'mp-baidu',
	'mp-alipay',
	'mp-toutiao'
]

const preprocessorContext = {}

PLATFORMS.forEach(platform => {
	preprocessorContext[platform.toUpperCase()] = false
})

preprocessorContext[process.env.TARGET.toUpperCase()] = true

preprocessorContext['MP'] = false
preprocessorContext['APP'] = false
preprocessorContext['APP-PLUS-NVUE'] = false
preprocessorContext['APP_PLUS_NVUE'] = false

if (process.env.TARGET.indexOf('mp-') === 0) {
	preprocessorContext['MP'] = true
}

if (process.env.TARGET.indexOf('app-') === 0) {
	preprocessorContext['APP'] = true
}

Object.keys(preprocessorContext).forEach(platform => {
	if (platform.indexOf('-') !== -1) {
		preprocessorContext[platform.replace(/-/g, '_')] = preprocessorContext[platform]
	}
})

exports.preprocessorContext = preprocessorContext

var isWin = /^win/.test(process.platform)

var normalizePath = function(path) {
	return isWin ? path.replace(/\\/g, "/") : path
}

function resolve(dir) {
	return path.join(__dirname, "..", dir)
}

var babelrc = {
	babelrc: false,
	retainLines: true,
	presets: [
		[
			resolve("node_modules/babel-preset-env"),
			{
				modules: "commonjs", //由 babel 转换 commonjs，保证lineno
				targets: {
					browsers: ["> 1%", "last 2 versions", "not ie <= 8"]
				}
			}
		],
		resolve("node_modules/babel-preset-stage-2")
	],
	plugins: [
		[
			resolve("node_modules/babel-plugin-transform-runtime"),
			{
				helpers: false,
				polyfill: false,
				regenerator: true,
				moduleName: resolve("node_modules/babel-runtime")
			}
		],
		resolve("node_modules/babel-plugin-transform-decorators-legacy")
	]
}

exports.babelLoader =
	normalizePath(path.resolve(__dirname, "../node_modules/babel-loader")) +
	"?" +
	JSON.stringify(babelrc)
exports.normalizePath = normalizePath
exports.assetsPath = function(_path) {
	var assetsSubDirectory =
		process.env.NODE_ENV === "production" ?
		config.build.assetsSubDirectory :
		config.dev.assetsSubDirectory
	return path.posix.join(assetsSubDirectory, _path)
}

exports.cssLoaders = function(options) {
	options = options || {}
	var cssVarLoader = {
		loader: resolve("lib/css-var-loader.js")
	}

	var preprocessorLoader = {
		loader: resolve("lib/preprocessor-loader.js"),
		options: {
			type: "js",
			context: preprocessorContext
		}
	}

	var cssLoader = {
		loader: resolve("node_modules/css-loader"),
		options: {
			minimize: process.env.NODE_ENV === "production",
			sourceMap: options.sourceMap
		}
	}

	var postcssLoader = {
		loader: resolve("node_modules/postcss-loader"),
		options: {
			config: {
				path: resolve(".postcssrc.js")
			},
			sourceMap: true
		}
	}

	const manifestJson = parseManifestJson()

	process.env.transformPx = manifestJson.transformPx === false ? "false" : "true" //always String

	var upxLoader = {
		loader: resolve("lib/css-upx-loader.js"),
		options: {
			baseDpr: 1,
			rpxUnit: 1
		}
	}

	var px2rpxLoader = {
		loader: resolve("node_modules/px2rpx-loader"),
		options: {
			baseDpr: 1,
			rpxUnit: 1
		}
	}

	// generate loader string to be used with extract text plugin
	function generateLoaders(loader, loaderOptions) {
		var loaders = [cssVarLoader, cssLoader]
		if (process.env.transformPx === "true") {
			//转换 px
			loaders.push(px2rpxLoader)
		}
		loaders.push(upxLoader) //upx=>rpx
		loaders.push(preprocessorLoader)
		loaders.push(postcssLoader)

		if (loader) {
			loaders.push({
				loader: resolve("node_modules/" + loader + "-loader"),
				options: Object.assign({}, loaderOptions, {
					sourceMap: options.sourceMap
				})
			})
		}

		// Extract CSS when that option is specified
		// (which is the case during production build)
		if (options.extract) {
			return ExtractTextPlugin.extract({
				use: loaders,
				fallback: resolve("node_modules/vue-style-loader")
			})
		} else {
			return [resolve("node_modules/vue-style-loader")].concat(loaders)
		}
	}

	// https://vue-loader.vuejs.org/en/configurations/extract-css.html

	//sass 全局变量
	const sassOptions = {
		data: SCSS
	}
    const uniScssFilePath = path.resolve(config.build.sourceRoot, 'uni.scss')
	if (fs.existsSync(uniScssFilePath)) {
		sassOptions.data = `
${SCSS}        
 @import "${normalizePath(uniScssFilePath)}";`
	}

	return {
		css: generateLoaders(),
		wxss: generateLoaders(),
		postcss: generateLoaders(),
		less: generateLoaders("less"),
		sass: generateLoaders("sass", {
			indentedSyntax: true,

		}, sassOptions),
		scss: generateLoaders("sass", Object.assign({}, sassOptions)),
		stylus: generateLoaders("stylus"),
		styl: generateLoaders("stylus")
	}
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function(options) {
	var output = []
	var loaders = exports.cssLoaders(options)
	for (var extension in loaders) {
		var loader = loaders[extension]
		output.push({
			test: new RegExp("\\." + extension + "$"),
			use: loader
		})
	}
	return output
}

var manifestJsonFilePath = path.resolve(config.build.sourceRoot, "./manifest.json")
const parseManifestJson = function() {
	let manifestJson = false

	try {
		manifestJson = JSON.parse(stripJsonComments(fs.readFileSync(manifestJsonFilePath, "utf8")))
	} catch (e) {
		console.error("manifest.json解析失败")
	}
	return manifestJson
}
exports.parseManifestJson = parseManifestJson

exports.getWebpackNVueConfig = function() {
	if (config.isAppPlus) {
		const pagesJson = parsePagesJson()
		if (pagesJson && pagesJson.nvue) {
			return require("./nvue/webpack.nvue.conf")(pagesJson.nvue.pages)
		}
	}
	return false
}

function datetime(date = new Date(), format = "HH:mm:ss") {
	let fn = d => {
		return ("0" + d).slice(-2)
	}
	const formats = {
		YYYY: date.getFullYear(),
		MM: fn(date.getMonth() + 1),
		DD: fn(date.getDate()),
		HH: fn(date.getHours()),
		mm: fn(date.getMinutes()),
		ss: fn(date.getSeconds())
	}
	return format.replace(/([a-z])\1+/gi, function(a) {
		return formats[a] || a
	})
}

function textColor(serverity) {
	switch (serverity.toLowerCase()) {
		case "success":
			return "green"
		case "info":
			return "blue"
		case "note":
			return "white"
		case "warning":
			return "yellow"
		case "error":
			return "red"
		default:
			return "red"
	}
}

exports.info = function(title, msg) {
	//console.log('[' + datetime() + ']' + ' ' + chalk[textColor('info')]('[' + title + ']', msg))
	console.log(chalk[textColor("info")]("[" + title + "]", msg))
}
exports.success = function(title, msg) {
	console.log(chalk[textColor("success")]("[" + title + "]", msg))
}
exports.warn = function(title, msg) {
	if (msg) {
		console.warn(chalk[textColor("warn")]("[" + title + "]", msg))
	} else {
		console.warn(chalk[textColor("warn")](title))
	}
}
exports.error = function(title, msg) {
	if (msg) {
		console.error(chalk[textColor("error")]("[" + title + "]", msg))
	} else {
		console.error(chalk[textColor("error")](title))
	}
}

exports.formatErrors = function(errors) {
	return errors.map(err => {
		if (err && err.message) {
			return `${err.message}\n at ${err.file}\n`
		}
		return ""
	})
}

exports.formatWarns = function(errors) {
	return errors
}

exports.writeAppAndPageJson = function(pagesJson, manifestJson) {
	manifestJson = manifestJson || {}
	const mpWeixinJson = manifestJson["mp-weixin"] || {}
	const appJson = {
		pages: [],
		window: pagesJson.globalStyle,
		tabBar: pagesJson.tabBar,
		networkTimeout: manifestJson.networkTimeout || {},
		debug: !!manifestJson.debug,
		functionalPages: !!mpWeixinJson.functionalPages,
		subPackages: [],
		workers: pagesJson.workers || "",
		preloadRule: pagesJson.preloadRule || {},
		requiredBackgroundModes: mpWeixinJson.requiredBackgroundModes || [],
		plugins: mpWeixinJson.plugins || {},
		resizable: !!mpWeixinJson.resizable,
		navigateToMiniProgramAppIdList: mpWeixinJson.navigateToMiniProgramAppIdList || [],
        permission:mpWeixinJson.permission||{},
		usingComponents: mpWeixinJson.usingComponents || {}
	}

	const subPackages = pagesJson.subPackages

	const subPackagesPages = []
	//处理分包
	if (subPackages && subPackages.length) {
		subPackages.forEach(subPackage => {
			const subPackagePages = subPackage.pages
			if (subPackage.root && subPackagePages && subPackagePages.length) {
				const newSubPackage = {
					root: subPackage.root,
					pages: [],
					independent: !!subPackage.independent
				}
				newSubPackage.pages = subPackagePages.map(page => {
					const filepath = path.resolve(
						config.build.wxRoot,
						subPackage.root,
						page.path + ".json"
					)
					const dirpath = path.dirname(filepath)
					if (!fs.existsSync(dirpath)) {
						shell.mkdir("-p", dirpath)
					}
					fs.writeFileSync(filepath, JSON.stringify(page.style || {}))
					subPackagesPages.push(subPackage.root + "/" + page.path)
					return page.path
				})
				appJson.subPackages.push(newSubPackage)
			}
		})
	}
	appJson.pages = pagesJson.pages
		.map(page => {
			if (~subPackagesPages.indexOf(page.path)) {
				//忽略分包
				return ""
			}
			const filepath = path.resolve(config.build.wxRoot, page.path + ".json")
			const dirpath = path.dirname(filepath)
			if (!fs.existsSync(dirpath)) {
				shell.mkdir("-p", dirpath)
			}
			fs.writeFileSync(filepath, JSON.stringify(page.style || {}))
			return page.path
		})
		.filter(pagepath => !!pagepath)

	if (config.isAppPlus && pagesJson.nvue) {
		appJson.nvue = pagesJson.nvue
	}
	if (fs.existsSync(config.build.wxRoot)) {
		//可能编译失败，导致目录未生成，此时无需写入 app.json
		fs.writeFileSync(path.resolve(config.build.wxRoot, "./app.json"), JSON.stringify(appJson))
	}
}
