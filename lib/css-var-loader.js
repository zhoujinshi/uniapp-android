module.exports = function (content) {
    this.cacheable && this.cacheable()
    if (process.env.TARGET === 'mp-weixin') {
        return content.replace(/var\(--status-bar-height\)/gi, '25px').replace(/var\(--window-top\)/gi, '0').replace(/var\(--window-bottom\)/gi, '0') //先简单处理
    }
    return content
}
