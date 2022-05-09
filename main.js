import Vue from 'vue'
import App from './App'
import store from './store'  // 与vue项目中配置相同，可自行配置
import request from './common/request.js'
import api from './api/index.js'
import url from './common/config.js'
import func from './common/common.js'
import NavBar from '@/components/navBar/index.vue'

Vue.config.productionTip = false

Vue.prototype.$request = request
Vue.prototype.$api = api
Vue.prototype.$url = url
Vue.prototype.$func = func
Vue.component('nav-bar', NavBar)
Vue.prototype.$myDevice = uni.getSystemInfoSync()
App.mpType = 'app'


const app = new Vue({
    ...App,
	store
})
app.$mount()
