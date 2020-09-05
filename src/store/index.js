import Vue from "vue"
import Vuex from "vuex"

import { createSharedMutations } from "vuex-electron"

Vue.use(Vuex)

export default new Vuex.Store({

  state: {
    isLoggedIn: false
  },

  actions: {
    loggedIn(store) {
      store.commit("loggedIn")
    },
  },

  mutations: {
    loggedIn(state) {
      state.isLoggedIn = true
    }
  },

  plugins: [createSharedMutations()],
  strict: process.env.NODE_ENV !== "production"
})