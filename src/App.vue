<template>
  <div v-if="isLoggedIn === true">
    <div class="sidebar-page">
      <section class="sidebar-layout">
        <b-sidebar
          position="static"
          type="is-light"
          open
        >
          <div class="p-1">
            <div class="block is-size-1 has-text-weight-bold has-text-centered">
              AUNT
              <div class="is-size-7 has-text-weight-normal has-text-centered">
                AussieBB usage notification tool
              </div>
            </div>
            <b-menu
              :accordion="false"
              :activable="false"
            >
              <b-menu-list label="Actions">
                <b-menu-item
                  :expanded="true"
                  icon="cable-data"
                  label="Bandwidth"
                >
                  <b-menu-item
                    tag="router-link"
                    :to="{ name: 'bandwidthUsage' }"
                    icon="chart-areaspline"
                    label="Usage"
                  />
                  <b-menu-item
                  
                    icon="bell-ring"
                    label="Notifications"
                  />
                </b-menu-item>
                <b-menu-item
                  icon="lan"
                  label="Network Centre"
                >
                  <b-menu-item
                    tag="router-link"
                    :to="{ name: 'networkIPAndLatency' }"
                    icon="wan"
                    label="IPs & Latency"
                  />
                  <b-menu-item
                    tag="router-link"
                    :to="{ name: 'networkOutages' }"
                    icon="network-strength-2-alert"
                    label="Outages"
                  />
                </b-menu-item>
              </b-menu-list>
              <b-menu-list label="AUNT">
                <b-menu-item
                  icon="cog"
                  label="Settings"
                />
                <b-menu-item
                  icon="logout"
                  label="Logout"
                />
              </b-menu-list>
            </b-menu>
          </div>
        </b-sidebar>

        <div class="p-2">
          <router-view />
        </div>
      </section>
    </div>
  </div>
  <div
    class="p-3"
    v-else
  >
    <div class="block is-size-1 has-text-weight-bold has-text-centered">
      AUNT
      <div class="is-size-7 has-text-weight-normal has-text-centered">
        AussieBB usage notification tool
      </div>
    </div>
    <b-message
      title="My Aussie Login"
      type="is-dark"
      has-icon
      icon="key"
      :closable="false"
    >
      <b-field label="Username">
        <b-input
          value=""
        />
      </b-field>
      <b-field label="Password">
        <b-input
          type="password"
          value=""
          password-reveal
        />
      </b-field>
      <b-button>Login</b-button>
    </b-message>
  </div>
</template>

<script>
  
import { mapState, mapActions } from "vuex"

export default {
  name: 'App',
  mounted() {
    this.$store.dispatch("loggedIn");
  },
  computed: mapState(["isLoggedIn"]),
  methods: {
    navRouter(url) {
      this.$router.push(url)
    }
  }
}
</script>

<style lang="scss">

// Import Bulma's core
@import "~bulma/sass/utilities/_all";

$sidebar-box-shadow: 0;

body::-webkit-scrollbar {
    display: none;
}
.p-1 {
  padding: 0.5em;
}
.p-2 {
  padding: 1.5em;
  width: 100%;
  overflow: auto;
}
.p-3 {
  padding: 12em;
  padding-top: 5em;
  width: 100%;
}
.sidebar-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 670px;
     //min-height: 100vh;
    .sidebar-layout {
        display: flex;
        flex-direction: row;
        height: 100%;
       // min-height: 100vh;
        .sidebar-content {
          height: 100%;
        }
    }
}

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";

</style>
