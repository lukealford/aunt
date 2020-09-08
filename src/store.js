import Vue from "vue"
import Vuex from "vuex"
const { ipcRenderer } = require('electron')

Vue.use(Vuex)

const electronHandlerPlugin = store => {
  store.subscribeAction((action, state) => {
    let ipc = ipcRenderer.sendSync(action.type, action.payload)
    for (var property in ipc) {
      store.commit(ipc[property].name, ipc[property].payload)
    }
  })
}

export default new Vuex.Store({

  state: {
    isLoggedIn: false
  },

  actions: {
    doLogin(store, loginData) {
      // Calling this action in component will trigger doLoggin in background.js triggering the loggedState mutation
    },
    doLogout(store, loginData) {
      // Calling this action in component will trigger doLogout in background.js triggering the loggedState mutation
    }
  },

  mutations: {
    loggedState(state, payload) {
      state.isLoggedIn = payload.value
    },
  },
  plugins: [electronHandlerPlugin],
  strict: process.env.NODE_ENV !== "production"
})