<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">رزرو جدید</p>
        <h2>انتخاب خدمت و زمان نوبت</h2>
      </div>
    </div>

    <div class="form-grid">
      <div>
        <label for="service">خدمت</label>
        <select id="service" v-model="form.serviceId" @change="loadProviders">
          <option value="">یک خدمت انتخاب کنید</option>
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.name }} - {{ money(service.base_price) }} ریال
          </option>
        </select>
      </div>

      <div>
        <label for="provider">ارائه‌دهنده</label>
        <select id="provider" v-model="form.providerId" :disabled="!providers.length" @change="loadSlots">
          <option value="">یک ارائه‌دهنده انتخاب کنید</option>
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.name }} {{ provider.family }} - {{ money(provider.price) }} ریال
          </option>
        </select>
      </div>

      <PersianDatePicker v-model="form.date" @update:model-value="loadSlots" />

      <div>
        <label for="time">زمان آزاد</label>
        <select id="time" v-model="form.time" :disabled="!slots.length">
          <option value="">یک زمان انتخاب کنید</option>
          <option v-for="slot in slots" :key="slot" :value="slot">{{ slot }}</option>
        </select>
      </div>
    </div>

    <div class="divider"></div>

    <div class="panel-heading compact">
      <h3>مشخصات مراجعه‌کننده</h3>
      <label class="check-row">
        <input v-model="bookForSelf" type="checkbox" @change="fillSelf" />
        رزرو برای خودم
      </label>
    </div>

    <form class="form-grid" @submit.prevent="book">
      <div>
        <label for="guest-name">نام</label>
        <input id="guest-name" v-model="form.guestName" required />
      </div>
      <div>
        <label for="guest-family">نام خانوادگی</label>
        <input id="guest-family" v-model="form.guestFamily" required />
      </div>
      <div>
        <label for="guest-phone">شماره موبایل</label>
        <input id="guest-phone" v-model="form.guestPhone" dir="ltr" required />
      </div>
      <div>
        <label for="guest-code">کد ملی</label>
        <input id="guest-code" v-model="form.guestNationalCode" dir="ltr" required />
      </div>
      <div class="form-actions full-width">
        <button class="button" :disabled="loading">پرداخت آزمایشی و ثبت نوبت</button>
      </div>
    </form>
    <p v-if="message" :class="['notice', messageType]">{{ message }}</p>
  </section>
</template>

<script>
import api, { errorMessage } from '../services/api'
import PersianDatePicker from './PersianDatePicker.vue'

export default {
  components: { PersianDatePicker },
  props: {
    services: { type: Array, required: true }
  },
  emits: ['booked'],
  data() {
    return {
      providers: [],
      slots: [],
      loading: false,
      message: '',
      messageType: 'success',
      bookForSelf: true,
      form: {
        serviceId: '',
        providerId: '',
        date: '',
        time: '',
        guestName: '',
        guestFamily: '',
        guestPhone: '',
        guestNationalCode: ''
      }
    }
  },
  mounted() {
    this.fillSelf()
  },
  methods: {
    money(value) {
      return Number(value).toLocaleString('fa-IR')
    },
    fillSelf() {
      if (!this.bookForSelf) return
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      this.form.guestName = user.name || ''
      this.form.guestFamily = user.family || ''
      this.form.guestPhone = user.phone || ''
      this.form.guestNationalCode = user.national_code || ''
    },
    async loadProviders() {
      this.form.providerId = ''
      this.form.time = ''
      this.providers = []
      this.slots = []
      if (!this.form.serviceId) return
      const { data } = await api.get(`/providers/${this.form.serviceId}`)
      this.providers = data
    },
    async loadSlots() {
      this.form.time = ''
      this.slots = []
      if (!this.form.providerId || !this.form.date) return
      const { data } = await api.get('/available-slots', {
        params: { providerId: this.form.providerId, date: this.form.date }
      })
      this.slots = data
    },
    async book() {
      this.loading = true
      this.message = ''
      try {
        await api.post('/appointments', this.form)
        this.message = 'پرداخت آزمایشی موفق بود و نوبت ثبت شد.'
        this.messageType = 'success'
        this.form.time = ''
        await this.loadSlots()
        this.$emit('booked')
      } catch (error) {
        this.message = errorMessage(error)
        this.messageType = 'error'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
