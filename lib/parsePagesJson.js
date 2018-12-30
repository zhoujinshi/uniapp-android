const path = require('path')
const fs = require('fs')
const stripJsonComments = require('strip-json-comments')
const preprocessor = require('./preprocess')

const config = require('../config')

const utils = require('../build/utils')

const pagesFilePath = path.resolve(config.build.sourceRoot, 'pages.json')

let pagesJson = false

//合并平台配置，并删除其他平台配置
const mergePlatformJson = function(obj) {
	if (obj) {
		if (obj[process.env.TARGET]) {
			Object.assign(obj, obj[process.env.TARGET])
		}
		config.platforms.forEach(function(platform) {
			delete obj[platform]
		})
	}
	return obj
}

module.exports = function parsePagesJson(reload) {
	if (reload !== true && pagesJson) { //cache
		return pagesJson
	}
	try {
		const content = fs.readFileSync(pagesFilePath, 'utf8')
		pagesJson = JSON.parse(stripJsonComments(preprocessor.preprocess(content, utils.preprocessorContext, {
			type: 'js'
		})))
	} catch (e) {
		utils.error('错误', 'pages.json 解析失败')
		return
	}

	//解析指定平台配置
	const platform = process.env.TARGET

	//globalStyle
	mergePlatformJson(pagesJson.globalStyle)

	const subPackages = pagesJson.subPackages
	if (subPackages && subPackages.length) {
		subPackages.forEach(subPackage => {
			const subPackagePages = subPackage.pages
			if (subPackage.root && subPackagePages && subPackagePages.length) {
				const concatSubPackagePages = []
				subPackagePages.forEach(subPackagePage => {
					concatSubPackagePages.push({
						path: subPackage.root + '/' + subPackagePage.path,
						style: subPackagePage.style
					})
				})
				//TODO 分包里的平台编译暂未处理
				pagesJson.pages = pagesJson.pages.concat(concatSubPackagePages)
			}
		})
		if (config.isAppPlus) {
			delete pagesJson.subPackages
		}
	}

	const nvue = {
		pages: {}
	}
	const len = pagesJson.pages.length
	for (let i = len - 1; i >= 0; i--) {
		let pagePath = pagesJson.pages[i].path

		mergePlatformJson(pagesJson.pages[i].style)

		const extname = path.extname(pagePath)
		if (extname) {
			pagePath = pagesJson.pages[i].path = pagePath.replace(extname, '')
		}
		if (pagePath.indexOf('platforms') === 0) { //平台相关
			if (pagePath.indexOf('platforms/' + platform) !== 0) { //非当前平台删除
				pagesJson.pages.splice(i, 1)
				continue
			}
		}
		if (config.isAppPlus && fs.existsSync(path.resolve(config.build.sourceRoot, pagePath + '.nvue'))) {
			nvue.pages[pagePath + '.html'] = {
				window: pagesJson.pages[i].style
			}
			if (i === 0) { //首页 nvue
				nvue.entryPagePath = pagePath
			}
			//TODO dev 模式最好不要删除
			pagesJson.pages.splice(i, 1) //从 MPVUE 中移除当前 page
			continue
		}

		if (!fs.existsSync(path.resolve(config.build.sourceRoot, pagePath + '.vue'))) {
			if (process.env.NODE_ENV === 'development') {
				utils.error('错误', 'pages.json 中配置的页面文件[' + pagePath + '.vue]不存在')
			} else {
				utils.error('错误', 'pages.json 中配置的页面文件[' + pagePath + '.vue]不存在,已被忽略')
				pagesJson.pages.splice(i, 1) //从 MPVUE 中移除当前 page
			}
		}
	}
	if (Object.keys(nvue.pages).length) {
		pagesJson.nvue = nvue
	}
	return pagesJson
}
