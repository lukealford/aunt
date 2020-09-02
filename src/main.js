// Core packages
import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'

import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Buefy, {
  defaultIconPack: 'mdi'
  // ...
})

// Router Components
import Home from './components/Home.vue'
import Network from './components/Network.vue'

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/network',
      name: 'network',
      component: Network
    },
  ]
})

Vue.config.productionTip = false
Vue.use(VueRouter)

new Vue({
  router,
  render: h => h(App),
  mounted() {
    // Prevent blank screen in Electron builds
    this.$router.push('/', () => {});
  }
}).$mount('#app')
