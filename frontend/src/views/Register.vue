<template>
  <div class="auth-page">
    <section class="auth-copy">
      <p class="eyebrow">شروع همکاری با نوبت‌یاب</p>
      <h1>ساخت حساب</h1>
      <p>به عنوان کاربر نوبت رزرو کنید یا به عنوان ارائه‌دهنده برنامه کاری خود را مدیریت کنید.</p>
    </section>
    <section class="auth-card wide">
      <h2>ثبت‌نام</h2>
      <form class="form-grid" @submit.prevent="submit">
        <div><label>نام</label><input v-model="form.name" required /></div>
        <div><label>نام خانوادگی</label><input v-model="form.family" required /></div>
        <div><label>ایمیل</label><input v-model="form.email" type="email" dir="ltr" required /></div>
        <div><label>شماره موبایل</label><input v-model="form.phone" dir="ltr" required /></div>
        <div><label>کد ملی</label><input v-model="form.national_code" dir="ltr" required /></div>
        <div><label>رمز عبور</label><input v-model="form.password" type="password" dir="ltr" required /></div>
        <div>
          <label>نوع حساب</label>
          <select v-model="form.role">
            <option value="user">کاربر</option>
            <option value="provider">ارائه‌دهنده</option>
          </select>
        </div>
        <div class="form-actions full-width"><button class="button">ایجاد حساب</button></div>
      </form>
      <p v-if="error" class="notice error">{{ error }}</p>
      <p class="auth-link">حساب دارید؟ <router-link to="/login">وارد شوید</router-link></p>
    </section>
  </div>
</template>

<script>
import api, { errorMessage } from '../services/api'
import { dashboardFor } from '../router'

export default {
  data() {
    return {
      error: '',
      form: { name: '', family: '', email: '', phone: '', national_code: '', password: '', role: 'user' }
    }
  },
  methods: {
    async submit() {
      try {
        const { data } = await api.post('/register', this.form)
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
