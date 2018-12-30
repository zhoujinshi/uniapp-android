const path = require('path')
const config = require('../config')

const getDependency = err => err.dependencies && err.dependencies.length && err.dependencies[0]


const LOCAL_RESOURCE_REGEX = /Module parse failed:\s*(.*)\s*Unexpected character/

const LINENO_REGEX = /\(([0-9]+):[0-9]+\)/

const FILE_REGEX = /in\s(.*)\s\(line\s([0-9]+),\scolumn\s[0-9]+\)/

function formatMessage(msg) {
    if (msg) {
        const matches = msg.match(FILE_REGEX)
        if (matches && matches.length === 3) {
            msg = msg.replace(matches[0], 'at ' + path.relative(config.build.sourceRoot, path.resolve(matches[1])) +
                ':' + matches[2])
        }
        return msg.replace('Module build failed: ', '模块编译失败：')
    }
    return ''
}

function ModuleBuildError(err) {

    const firstLineMessage = err.message.split('\n')[0]
    if (~firstLineMessage.indexOf('Module build failed: ModuleBuildError: Module build failed:')) {
        //移除调用栈错误
        return false
    }
    if (~firstLineMessage.indexOf('Failed to find')) { //css 引用路径错误
        return {
            line: 1,
            message: '文件查找失败：' + firstLineMessage.split('Failed to find')[1]
        }
    } else if (~firstLineMessage.indexOf('SyntaxError:') || ~firstLineMessage.indexOf('Syntax Error')) {
        if (~firstLineMessage.indexOf('ModuleBuildError: Module build failed: Syntax Error')) {
            return false
        }

        if (err.error && err.error.loc) { //babel
            return {
                line: err.error.loc.line || 1,
                message: (err.message + '\n').replace('Module build failed: SyntaxError:', '语法错误:').replace(
                    /^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, '') + '     '
            }
        } else { //css
            const message = (err.message).replace('Module build failed: Syntax Error', '语法错误:').replace(
                /^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, '') + '      '
            const matches = message.match(LINENO_REGEX)
            if (matches && matches.length === 2) {
                return {
                    line: matches[1],
                    message,
                }
            }
        }
    } else if (~firstLineMessage.indexOf('Cannot find module')) {
        let builtinCompile = ''
        if (~firstLineMessage.indexOf('compile-less')) {
            builtinCompile = 'less'
        } else if (~firstLineMessage.indexOf('compile-node-sass')) {
            builtinCompile = 'scss/sass'
        } else if (~firstLineMessage.indexOf('compile-stylus')) {
            builtinCompile = 'stylus'
        } else if (~firstLineMessage.indexOf('compile-typescript')) {
            builtinCompile = 'typescript'
        }
        if (builtinCompile) {
            return {
                message: '预编译器错误：代码使用了' + builtinCompile + '语言，但未安装相应编译器，请在菜单工具-插件安装里安装相应编译插件'
            }
        }
    } else if (~firstLineMessage.indexOf('Module parse failed')) {
        const matches = firstLineMessage.match(LOCAL_RESOURCE_REGEX)
        if (matches && matches.length === 2) {
            return {
                message: '资源引用失败：暂不支持引用本地资源\'' + matches[1].trim() + '\',可更换为网络地址或base64'
            }
        }
    }
    return formatMessage(err.message)
}

function ModuleNotFoundError(err) {
    const dependency = getDependency(err)
    if (dependency) {
        return {
            line: dependency.loc.start.line || 1,
            message: '文件查找失败：\'' + dependency.userRequest + '\''
        }
    }
}

function ModuleParseError(err) {
    const firstLineMessage = err.message.split('\n')[0]
    const matches = firstLineMessage.match(LOCAL_RESOURCE_REGEX)
    if (matches && matches.length === 2) {
        return {
            message: `资源引用失败：暂不支持引用此类型资源（${err.module.rawRequest}）`
        }
    }
}

module.exports = {
    ModuleBuildError,
    ModuleNotFoundError,
    ModuleParseError,
    ChunkRenderError(err) {

    },
    EntryModuleNotFoundError(err) {

    },
    ModuleDependencyError(err) {

    },
    ModuleError(err) {

    },

    ModuleDependencyWarning(warn) {

    },
    ModuleWarning(warn) {

    },
}
