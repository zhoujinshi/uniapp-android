// https://github.com/michael-ciniawsky/postcss-load-config
module.exports = {
  "plugins": [require('postcss-mpvue-wxss'),require('postcss-import'),require('autoprefixer')({browsers: ['iOS >= 8', 'Android >= 4']})]
}