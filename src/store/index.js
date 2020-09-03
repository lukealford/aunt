import Vue from "vue"
import Vuex from "vuex"

import { createSharedMutations } from "vuex-electron"

Vue.use(Vuex)

export default new Vuex.Store({

  plugins: [createSharedMutations()],
  strict: process.env.NODE_ENV !== "production"
})