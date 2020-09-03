<template>
  <div id="app">
    <b-tabs @input="navRouter">
      <b-tab-item
        label="Home"
        value="/"
        icon="home"
      />
      <b-tab-item
        label="Network"
        value="/network"
        icon="check-network-outline"
      />
      <router-view />
    </b-tabs>
  </div>
</template>

<script>
  
import { mapState, mapActions } from "vuex"

export default {
  name: 'App',
  methods: {
    navRouter(url) {
      this.$router.push(url)
    }
  }
}
</script>

<style>

</style>
