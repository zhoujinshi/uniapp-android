import Vue from 'vue'

import View from './components/view.vue'
import Input from './components/input.vue'
import TabBar from './components/tabBar.vue'

import Secondary from '../src/Secondary.vue'

Vue.config.productionTip = false
const htmlRegex = /^html:/i
Vue.config.isReservedTag = tag => htmlRegex.test(tag)
Vue.config.parsePlatformTagName = name => name = name.replace(htmlRegex, '')
Vue.config.getTagNamespace = tag => false
Vue.component('view', View)
Vue.component('input', Input)
Vue.component('tab-bar', TabBar)

new Vue({
  render: h => h(Secondary)
}).$mount('#app')