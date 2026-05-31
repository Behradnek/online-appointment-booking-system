<template>
  <div class="auth-page">
    <section class="auth-copy">
      <p class="eyebrow">سامانه مدیریت نوبت</p>
      <h1>نوبت‌یاب</h1>
      <p>رزرو خدمات، مدیریت برنامه کاری و پیگیری نوبت‌ها در یک محیط ساده و فارسی.</p>
    </section>
    <section class="auth-card">
      <h2>ورود به حساب</h2>
      <form @submit.prevent="submit">
        <label for="email">ایمیل</label>
        <input id="email" v-model="form.email" type="email" dir="ltr" required />
        <label for="password">رمز عبور</label>
        <input id="password" v-model="form.password" type="password" dir="ltr" required />
        <button class="button full-width">ورود</button>
      </form>
      <p v-if="error" class="notice error">{{ error }}</p>
      <p class="auth-link">حساب ندارید؟ <router-link to="/register">ثبت‌نام کنید</router-link></p>
      <p class="helper">ورود نمونه: user@example.com / 123456</p>
    </section>
  </div>
</template>

<script>
import api, { errorMessage } from '../services/api'
import { dashboardFor } from '../router'

export default {
  data() {
    return { form: { email: '', password: '' }, error: '' }
  },
  methods: {
    async submit() {
      try {
        const { data } = await api.post('/login', this.form)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        this.$router.push(dashboardFor(data.user.role))
      } catch (error) {
        this.error = errorMessage(error)
      }
    }
  }
}
</script>
