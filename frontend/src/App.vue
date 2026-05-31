<template>
  <Navbar v-if="user" :user="user" @logout="logout" />
  <main class="page-shell">
    <router-view />
  </main>
</template>

<script>
import Navbar from './components/Navbar.vue'

export default {
  components: { Navbar },
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || 'null')
    }
  },
  watch: {
    $route() {
      this.user = JSON.parse(localStorage.getItem('user') || 'null')
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.user = null
      this.$router.push('/login')
    }
  }
}
</script>
