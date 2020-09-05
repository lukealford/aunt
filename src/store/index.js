import Vue from "vue"
import Vuex from "vuex"
const { ipcRenderer } = require('electron')

Vue.use(Vuex)

export default new Vuex.Store({

  state: {
    isLoggedIn: false
  },

  actions: {
    loggedIn(store) {
      if(ipcRenderer.sendSync('check-loggedin') === true) {
        store.commit("loggedIn")
      }
    },
  },

  mutations: {
    loggedIn(state) {
      state.isLoggedIn = true
    }
  },
  strict: process.env.NODE_ENV !== "production"
})