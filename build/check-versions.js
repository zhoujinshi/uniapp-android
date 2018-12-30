var fs = require('fs')
var path = require('path')
// var chalk = require('chalk')
// var semver = require('semver')
// var packageConfig = require('../package.json')
// var shell = require('shelljs')

// function exec(cmd) {
//     return require('child_process').execSync(cmd).toString().trim()
// }
// 
// var versionRequirements = [{
//     name: 'node',
//     currentVersion: semver.clean(process.version),
//     versionRequirement: packageConfig.engines.node
// }]
// 
// if (shell.which('npm')) {
//     versionRequirements.push({
//         name: 'npm',
//         currentVersion: exec('npm --version'),
//         versionRequirement: packageConfig.engines.npm
//     })
// }

const isWin = /^win/.test(process.platform)

const wccRelativePath = isWin ? './package.nw/js/vendor/wcc.exe' : './Contents/Resources/app.nw/js/vendor/wcc'
const wccOldMacRelativePath = './Contents/Resources/package.nw/js/vendor/wcc'

const wcscRelativePath = isWin ? './package.nw/js/vendor/wcsc.exe' : './Contents/Resources/app.nw/js/vendor/wcsc'
const wcscOldMacRelativePath = './Contents/Resources/package.nw/js/vendor/wcsc'

const wxDevToolsAppDataWindowsPath = process.env.APPDATA && path.resolve(process.env.APPDATA, './Tencent/微信web开发者工具/') ||
    __dirname

const wxDevToolsDirs = []

if (isWin) {
    wxDevToolsDirs.push([
        path.resolve(wxDevToolsAppDataWindowsPath, wccRelativePath),
        path.resolve(wxDevToolsAppDataWindowsPath, wcscRelativePath)
    ])
}
wxDevToolsDirs.push([
    path.resolve(process.env.WX_DEVTOOLS || __dirname, wccRelativePath),
    path.resolve(process.env.WX_DEVTOOLS || __dirname, wcscRelativePath)
])
wxDevToolsDirs.push([
    path.resolve(process.env.WX_DEVTOOLS || __dirname, wccOldMacRelativePath),
    path.resolve(process.env.WX_DEVTOOLS || __dirname, wcscOldMacRelativePath)
])
if (!isWin) {
    wxDevToolsDirs.push([
        path.resolve('/Applications/微信开发者工具.app/', wccRelativePath),
        path.resolve('/Applications/微信开发者工具.app/', wcscRelativePath)
    ])
    wxDevToolsDirs.push([
        path.resolve('/Applications/微信开发者工具.app/', wccOldMacRelativePath),
        path.resolve('/Applications/微信开发者工具.app/', wcscOldMacRelativePath)
    ])
    wxDevToolsDirs.push([
        path.resolve('/Applications/wechatwebdevtools.app/', wccRelativePath),
        path.resolve('/Applications/wechatwebdevtools.app/', wcscRelativePath)
    ])
    wxDevToolsDirs.push([
        path.resolve('/Applications/wechatwebdevtools.app/', wccOldMacRelativePath),
        path.resolve('/Applications/wechatwebdevtools.app/', wcscOldMacRelativePath)
    ])
}
const isWXDevToolsInstalled = () => {
    for (let i = 0; i < wxDevToolsDirs.length; i++) {
        const dir = wxDevToolsDirs[i]
        if (fs.existsSync(dir[0]) && fs.existsSync(dir[1])) {
            return true
        }
    }
    return false
}

module.exports = function () {
//     var warnings = []
//     for (var i = 0; i < versionRequirements.length; i++) {
//         var mod = versionRequirements[i]
//         if (!semver.satisfies(mod.currentVersion, mod.versionRequirement)) {
//             warnings.push(mod.name + ': ' +
//                 chalk.red(mod.currentVersion) + ' should be ' +
//                 chalk.green(mod.versionRequirement)
//             )
//         }
//     }
// 
//     if (warnings.length) {
//         console.log('')
//         console.log(chalk.yellow('To use this template, you must update following to modules:'))
//         console.log()
//         for (var i = 0; i < warnings.length; i++) {
//             var warning = warnings[i]
//             console.log('  ' + warning)
//         }
//         console.log()
//         process.exit(1)
//     }

    if (!isWXDevToolsInstalled()) {
        console.error(`
1.检查升级最新版本微信开发者工具		
2.检查微信开发者工具配置目录是否正确（菜单运行-运行到小程序模拟器-运行设置）
3.重新安装最新版本微信开发者工具
	`)
        process.exit(1)
    }
    var utils = require('./utils')
    utils.info('提示', '如编译时间较长，请注意将本工程目录从杀毒软件、搜索索引软件的监控名单移除。')
}
