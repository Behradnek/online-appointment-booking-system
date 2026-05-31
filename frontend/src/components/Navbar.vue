<template>
  <header class="navbar">
    <router-link class="brand" :to="home">نوبت‌یاب</router-link>
    <div class="navbar-user">
      <span>{{ user.name }} {{ user.family }}</span>
      <span class="role-tag">{{ roleLabel }}</span>
      <button class="button button-ghost" type="button" @click="$emit('logout')">خروج</button>
    </div>
  </header>
</template>

<script>
import { dashboardFor } from '../router'

export default {
  props: {
    user: { type: Object, required: true }
  },
  computed: {
    home() {
      return dashboardFor(this.user.role)
    },
    roleLabel() {
      return { admin: 'مدیر', provider: 'ارائه‌دهنده', user: 'کاربر' }[this.user.role]
    }
  }
}
</script>
