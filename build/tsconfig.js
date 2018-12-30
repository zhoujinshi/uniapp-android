const path = require('path')
const config = require('../config')

function resolve(dir) {
    return path.join(__dirname, '..', dir)
}


module.exports = {
    'compilerOptions': {
        'target': 'es5',
        'strict': true,
        'module': 'es2015',
        'moduleResolution': 'node',
        'baseUrl': config.build.sourceRoot,
        // 'outDir': './dist/',
        'paths': {
            '@/*': [
                config.build.sourceRoot + '/*'
            ],
			'uni':[
				resolve('lib/uni.' + process.env.TARGET + '.js')
			],
            'vue': [
                resolve('node_modules/vue')
            ],
            'vuex': [
                resolve('node_modules/vuex')
            ],
            'vue-property-decorator': [
                resolve('node_modules/vue-property-decorator')
            ]
        },
        'types': [
            resolve('lib/@types/uni-app'),
            resolve('node_modules/@types/webpack-env'),
            resolve('node_modules/@types/weixin-app')

        ],
        'allowJs': true,
        'allowSyntheticDefaultImports': true,
        'noImplicitAny': false,
        'skipLibCheck': true,
        'strictPropertyInitialization': false,
        'experimentalDecorators': true
    },
    'include': [
        config.build.sourceRoot
    ],
    'exclude': [
        config.build.sourceRoot + '/unpackage'
    ],
    'typeAcquisition': {
        'enable': true
    }
}
