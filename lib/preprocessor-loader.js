const utils = require('loader-utils')
const preprocessor = require('./preprocess/lib/preprocess')
module.exports = function(content, map) {
	this.cacheable && this.cacheable()

	const type = utils.getOptions(this).type || 'js'

	const context = utils.getOptions(this).context || {}

	this.callback(null, preprocessor.preprocess(content, context, {
		type
	}), map)
}
