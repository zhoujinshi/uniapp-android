var path = require('path')

const css = require('css')
const loaderUtils = require('loader-utils')

//暂时只处理 upx，后续其他平台，需要处理 rpx
const UPX_REGEXP = /\b(\d+(\.\d+)?)upx\b/
// const UPX_REGEXP = /\b(\d+(\.\d+)?)[u|r]px\b/


const getCalcValue = function (type, value) {
    const upxGlobalRegExp = new RegExp(UPX_REGEXP.source, 'g')

    return value.replace(upxGlobalRegExp, function ($0, $1) {
        return $1 + type
    })
}

const transformUpx = function (cssText, config, resourcePath) {
    const astObj = css.parse(cssText, {
        source: resourcePath
    })

    function processRules(rules) { // FIXME: keyframes do not support `force upx` comment
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i]
            if (rule.type === 'media') {
                processRules(rule.rules) // recursive invocation while dealing with media queries
                continue
            } else if (rule.type === 'keyframes') {
                processRules(rule.keyframes, true) // recursive invocation while dealing with keyframes
                continue
            } else if (rule.type !== 'rule' && rule.type !== 'keyframe') {
                continue
            }

            const declarations = rule.declarations
            for (let j = 0; j < declarations.length; j++) {
                const declaration = declarations[j]
                // need transform: declaration && has 'upx'
                if (declaration.type === 'declaration' && UPX_REGEXP.test(declaration.value)) {
                    declaration.value = getCalcValue(config.unit || 'rpx', declaration.value) // common transform
                }
            }

            // if the origin rule has no declarations, delete it
            if (!rules[i].declarations.length) {
                rules.splice(i, 1)
                i--
            }
        }
    }

    processRules(astObj.stylesheet.rules)

    return css.stringify(astObj)
}
module.exports = function (source) { //TODO 后续有时间调整为 postcss 插件吧
    try {
        return transformUpx(source, typeof this.query === 'string' ? loaderUtils.parseQuery(this.query) : this.query, path.relative(process.env.SOURCR_ROOT, this.resourcePath))
    } catch (error) {
        let msg=error.message.split(/:\d+:\s/)
        this.emitError(new Error(`css parse error: ${msg[1]} at ${msg[0]}`))
        this.callback(null, '')
    }
}
