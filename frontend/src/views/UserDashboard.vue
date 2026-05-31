<template>
  <div>
    <section class="dashboard-header">
      <div>
        <p class="eyebrow">داشبورد کاربر</p>
        <h1>رزرو و پیگیری نوبت‌ها</h1>
      </div>
      <div class="metric"><strong>{{ appointments.length }}</strong><span>نوبت ثبت‌شده</span></div>
    </section>

    <AppointmentForm :services="services" @booked="loadAppointments" />

    <section class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">سوابق من</p><h2>نوبت‌های ثبت‌شده</h2></div>
        <button class="button button-light" @click="loadAppointments">به‌روزرسانی</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>خدمت</th><th>ارائه‌دهنده</th><th>تاریخ</th><th>ساعت</th><th>وضعیت</th><th>پرداخت</th><th></th></tr></thead>
          <tbody>
            <tr v-for="item in appointments" :key="item.id">
              <td>{{ item.service_name }}</td>
              <td>{{ item.provider_name }} {{ item.provider_family }}</td>
              <td>{{ jalali(item.appointment_date) }}</td>
              <td>{{ item.appointment_time }}</td>
              <td><span class="status" :class="item.status">{{ status(item.status) }}</span></td>
              <td>{{ payment(item.payment_status) }}</td>
              <td><button v-if="['pending', 'confirmed'].includes(item.status)" class="button button-danger small" @click="cancel(item.id)">لغو</button></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!appointments.length" class="empty">هنوز نوبتی ثبت نشده است.</p>
      </div>
      <p v-if="message" :class="['notice', messageType]">{{ message }}</p>
    </section>
  </div>
</template>

<script>
import api, { errorMessage } from '../services/api'
import AppointmentForm from '../components/AppointmentForm.vue'
import { toJalali } from '../utils/dateHelper'

export default {
  components: { AppointmentForm },
  data() {
    return { services: [], appointments: [], message: '', messageType: 'success' }
  },
  async mounted() {
    const [services] = await Promise.all([api.get('/services'), this.loadAppointments()])
    this.services = services.data
  },
  methods: {
    jalali: toJalali,
    status(value) {
      return { pending: 'در انتظار', confirmed: 'تاییدشده', completed: 'انجام‌شده', canceled: 'لغوشده' }[value]
    },
    payment(value) {
      return { unpaid: 'پرداخت‌نشده', paid: 'پرداخت‌شده', refunded: 'بازگشت وجه' }[value]
    },
    async loadAppointments() {
      const { data } = await api.get('/appointments/my')
      this.appointments = data
    },
    async cancel(id) {
      try {
        const { data } = await api.delete(`/appointments/${id}`)
        this.message = data.payment_status === 'refunded' ? 'نوبت لغو و وجه بازگردانده شد.' : 'نوبت لغو شد.'
        this.messageType = 'success'
        await this.loadAppointments()
      } catch (error) {
        this.message = errorMessage(error)
        this.messageType = 'error'
      }
    }
  }
}
</script>
