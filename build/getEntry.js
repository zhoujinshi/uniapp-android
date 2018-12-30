const path = require('path')
const fs = require('fs')

const utils = require('./utils')
const config = require('../config')

const VirtualModulesPlugin = require('webpack-virtual-modules')

const parsePagesJson = require('../lib/parsePagesJson')

const pagesFilePath = path.resolve(config.build.sourceRoot, './pages.json')
const mainfestFilePath = path.resolve(config.build.sourceRoot, './manifest.json')

const mainJsPath = path.resolve(config.build.sourceRoot, './main.js')
const mainTsPath = path.resolve(config.build.sourceRoot, './main.ts')

const defaultMainJsCode = pagePath => {
	return `
import pageFactory from 'mpvue-page-factory'
import App from '${utils.normalizePath(path.resolve(config.build.sourceRoot,pagePath))}.vue'
Page(pageFactory(App))
`
}

const genEntry = function(sourceRoot, reload) {
	if (!fs.existsSync(pagesFilePath)) {
		throw new Error('pages.json 不存在')
	}

	const pagesJson = parsePagesJson(reload)

	if (!pagesJson) {
		return
	}

	let isTs = false
	if (fs.existsSync(mainTsPath)) {
		isTs = true
	}
	if (isTs) {
		if (!fs.existsSync(path.resolve(__dirname, '../../compile-typescript'))) {
			console.error('预编译器错误：代码使用了typescript语言，但未安装相应编译器，请在菜单工具-插件安装里安装相应编译插件')
			process.exit(1)
		}
	}
	const entry = {
		'app': isTs ? mainTsPath : mainJsPath
	}
	const pageStyles = {}
	const virtualModules = {}
	// virtualModules[mainJsPath] = fs.readFileSync(isTs ? mainTsPath : mainJsPath, 'utf8')

	pagesJson.pages.map(page => {
		const absolutePath = path.resolve(sourceRoot, page.path + '.js')
		entry[page.path] = absolutePath

		page.style = page.style || {}

		pageStyles[page.path] = page.style

		const mainJsPath = path.resolve(absolutePath, '../main.' + isTs ? 'ts' : 'js')
		let mainJsCode = defaultMainJsCode(page.path)
		if (fs.existsSync(mainJsPath)) {
			mainJsCode = fs.readFileSync(mainJsPath, 'utf8')
		}
		virtualModules[absolutePath] = mainJsCode
		return page.path
	})

	return {
		entry,
		virtualModules,
		pageStyles
	}
}

let webpackEntry = {}
let virtualModules = {}

let pageStyles = {}

module.exports = function getEntry(sourceRoot) {
	const ret = genEntry(sourceRoot)
	if (!ret) {
		return
	}
	webpackEntry = ret.entry
	virtualModules = ret.virtualModules
	pageStyles = ret.pageStyles

	const virtualModulesPlugin = new VirtualModulesPlugin(virtualModules)

	if (process.env.NODE_ENV === 'development') {
		const watchCallback = () => {

			const newRet = genEntry(sourceRoot, true) //动态调整 pages.json
			if (!newRet) {
				return
			}
			const newEntry = newRet.entry
			const newVirtualModules = newRet.virtualModules
			const newPageStyles = newRet.pageStyles
			let changed = false
			Object.keys(newEntry).forEach(pagePath => {
				if (!webpackEntry[pagePath]) {
					changed = true
					utils.info('新增', pagePath)
					virtualModulesPlugin.writeModule(newEntry[pagePath], newVirtualModules[
						newEntry[
							pagePath]])
				}
			})
			Object.keys(newPageStyles).forEach(pagePath => {
				const pageStyle = pageStyles[pagePath]
				if (pageStyle) {
					const newPageStyle = newPageStyles[pagePath]
					if (JSON.stringify(pageStyle) !== JSON.stringify(newPageStyle)) {
						changed = true
						utils.info('更新', pagePath)
						virtualModulesPlugin.writeModule(newEntry[pagePath], newVirtualModules[
							newEntry[pagePath]])
					}
				}
			})

            if(!changed){
                virtualModulesPlugin.writeModule(newEntry['app'], newVirtualModules[newEntry['app']])
            }else{
                utils.info('编译', 'Compiling...')
            }

			webpackEntry = newEntry
			pageStyles = newPageStyles
			virtualModulesPlugin.onModulesChange && virtualModulesPlugin.onModulesChange()


		}
		fs.watchFile(mainfestFilePath, watchCallback)
		fs.watchFile(pagesFilePath, watchCallback)
	}
	return {
		entry() {
			return webpackEntry
		},
		virtualModulesPlugin
	}

}
