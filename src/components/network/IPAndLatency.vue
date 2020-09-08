<template>
  <div>
    <b-message
      title="IP Addresses"
      type="is-dark"
      :closable="false"
    >
      <b-field
        grouped
        group-multiline
      >
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              IPv6
            </b-tag>
            <b-tag type="is-info">
              2403:5800:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              IPv4
            </b-tag>
            <b-tag type="is-info">
              103.115.xxx.xx
            </b-tag>
          </b-taglist>
        </div>
      </b-field>
      <br>
      <b-field
        grouped
        group-multiline
      >
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              CGNAT
            </b-tag>
            <b-tag type="is-warning">
              Disabled
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Port Blocking
            </b-tag>
            <b-tag type="is-success">
              Enabled
            </b-tag>
          </b-taglist>
        </div>
      </b-field>
      <br>
    </b-message>
    
    <b-message
      title="Latency"
      type="is-dark"
      :closable="false"
    >
      <div class="is-size-6 has-text-weight-bold">
        Local
      </div>
      <b-field
        grouped
        group-multiline
      >
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Gateway
            </b-tag>
            <b-tag type="is-success">
              0ms
            </b-tag>
          </b-taglist>
        </div>
      </b-field>
   
      <div class="is-size-6 has-text-weight-bold">
        Australia
      </div>
      <b-field
        grouped
        group-multiline
      >
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Brisbane
            </b-tag>
            <b-tag type="is-success">
              45ms
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Sydney
            </b-tag>
            <b-tag type="is-success">
              29ms
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Melbourne
            </b-tag>
            <b-tag type="is-success">
              18ms
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Adelaide
            </b-tag>
            <b-tag type="is-success">
              8ms
            </b-tag>
          </b-taglist>
        </div>
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Perth
            </b-tag>
            <b-tag type="is-success">
              56ms
            </b-tag>
          </b-taglist>
        </div>
      </b-field>

      <div class="is-size-6 has-text-weight-bold">
        United States
      </div>
      <b-field
        grouped
        group-multiline
      >
        <div class="control">
          <b-taglist attached>
            <b-tag type="is-dark">
              Los Angeles
            </b-tag>
            <b-tag type="is-success">
              196ms
            </b-tag>
          </b-taglist>
        </div>
      </b-field>
      <br>
    </b-message>
  </div>
</template>

<script>
export default {
  name: 'IPAndLatency'
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
