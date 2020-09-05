// Core packages
import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import store from "./store"

import Buefy from 'buefy'

Vue.use(Buefy, {
  defaultIconPack: 'mdi'
})

// Router Components
import BandwidthUsage from './components/bandwidth/Usage.vue'
import NetworkIPAndLatency from './components/network/IPAndLatency.vue'
import NetworkOutages from './components/network/Outages.vue'

const router = new VueRouter({
  mode: 'history',
  linkActiveClass: 'is-active',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/bandwidth-usage',
      name: 'bandwidthUsage',
      component: BandwidthUsage
    },
    {
      path: '/network-ip-and-latency',
      name: 'networkIPAndLatency',
      component: NetworkIPAndLatency
    },
    {
      path: '/network-outages',
      name: 'networkOutages',
      component: NetworkOutages
    },
  ]
})

Vue.config.productionTip = false
Vue.use(VueRouter)

new Vue({
  router,
  store,
  render: h => h(App),
  mounted() {
    // Prevent blank screen in Electron builds
    this.$router.push('/bandwidth-usage', () => {});
  }
}).$mount('#app')
