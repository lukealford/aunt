<template>
  <p>
    <b-message
      title="NBN Scheduled Outage"
      type="is-danger"
      :closable="false"
    >
      Start Time: 16-09-2020 12:00:00AM<br>
      End Time: 16-09-2020 06:00:00AM
    </b-message>
  </p>
</template>

<script>
export default {
  name: 'NetworkOutages'
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
