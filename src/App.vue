<template>
<div id="app">
    <b-tabs @input="navRouter">
        <b-tab-item label="Home" value="/" icon="home"></b-tab-item>
        <b-tab-item label="Network" value="/network" icon="check-network-outline"></b-tab-item>
        <router-view></router-view>
    </b-tabs>
</div>
</template>

<script>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  
}
</style>
