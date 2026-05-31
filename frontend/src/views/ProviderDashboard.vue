<template>
  <div>
    <section class="dashboard-header">
      <div><p class="eyebrow">پنل ارائه‌دهنده</p><h1>برنامه کاری و نوبت‌ها</h1></div>
      <div class="metric"><strong>{{ appointments.length }}</strong><span>نوبت دریافتی</span></div>
    </section>

    <div class="dashboard-grid">
      <WorkingHoursForm />
      <section class="panel">
        <p class="eyebrow">قوانین لغو</p>
        <h2>سیاست کنسلی</h2>
        <form @submit.prevent="savePolicy">
          <label>حداقل زمان لغو پیش از نوبت (ساعت)</label>
          <input v-model.number="policy.minHoursBefore" type="number" min="0" />
          <label class="check-row"><input v-model="policy.enablePenalty" type="checkbox" /> اعمال جریمه در صورت لغو</label>
          <label>توضیحات</label>
          <textarea v-model="policy.description" rows="3"></textarea>
          <button class="button">ذخیره سیاست لغو</button>
        </form>
      </section>
    </div>

    <section class="panel">
      <p class="eyebrow">گسترش خدمات</p>
      <h2>درخواست خدمت جدید</h2>
      <form class="form-grid" @submit.prevent="sendRequest">
        <div><label>دسته‌بندی</label><select v-model="request.categoryId" required><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
        <div><label>نام خدمت</label><input v-model="request.name" required /></div>
        <div><label>مدت پیشنهادی (دقیقه)</label><input v-model.number="request.estimatedDuration" type="number" min="1" required /></div>
        <div><label>قیمت پیشنهادی (ریال)</label><input v-model.number="request.suggestedPrice" type="number" min="1" required /></div>
        <div class="full-width"><label>توضیحات</label><textarea v-model="request.description" rows="3"></textarea></div>
        <div class="form-actions full-width"><button class="button">ارسال درخواست</button></div>
      </form>
      <div class="chips"><span v-for="item in requests" :key="item.id" class="chip">{{ item.name }}: {{ requestStatus(item.status) }}</span></div>
    </section>

    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">مراجعان</p><h2>نوبت‌های دریافتی</h2></div><button class="button button-light" @click="loadAppointments">به‌روزرسانی</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>مراجعه‌کننده</th><th>خدمت</th><th>تاریخ</th><th>ساعت</th><th>وضعیت</th><th></th></tr></thead>
          <tbody><tr v-for="item in appointments" :key="item.id"><td>{{ item.guest_name }} {{ item.guest_family }}</td><td>{{ item.service_name }}</td><td>{{ jalali(item.appointment_date) }}</td><td>{{ item.appointment_time }}</td><td>{{ item.status }}</td><td class="action-row"><button v-if="item.status === 'pending'" class="button small" @click="setStatus(item.id, 'confirmed')">تایید</button><button v-if="item.status === 'confirmed'" class="button small" @click="setStatus(item.id, 'completed')">انجام شد</button></td></tr></tbody>
        </table>
        <p v-if="!appointments.length" class="empty">نوبتی دریافت نشده است.</p>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../services/api'
import WorkingHoursForm from '../components/WorkingHoursForm.vue'
import { toJalali } from '../utils/dateHelper'

export default {
  components: { WorkingHoursForm },
  data() {
    return {
      categories: [], appointments: [], requests: [],
      policy: { minHoursBefore: 24, enablePenalty: false, description: '' },
      request: { categoryId: '', name: '', description: '', estimatedDuration: 30, suggestedPrice: 500000 }
    }
  },
  async mounted() {
    const [categories, policy] = await Promise.all([api.get('/categories'), api.get('/provider/cancellation-policy'), this.loadAppointments(), this.loadRequests()])
    this.categories = categories.data
    if (this.categories[0]) this.request.categoryId = this.categories[0].id
    this.policy = { minHoursBefore: policy.data.min_hours_before, enablePenalty: Boolean(policy.data.enable_penalty), description: policy.data.description || '' }
  },
  methods: {
    jalali: toJalali,
    requestStatus(value) { return { pending: 'در انتظار', approved: 'تاییدشده', rejected: 'ردشده' }[value] },
    async loadAppointments() { this.appointments = (await api.get('/provider/appointments')).data },
    async loadRequests() { this.requests = (await api.get('/service-requests/my')).data },
    async savePolicy() { await api.put('/provider/cancellation-policy', this.policy) },
    async sendRequest() { await api.post('/service-requests', this.request); this.request.name = ''; this.request.description = ''; await this.loadRequests() },
    async setStatus(id, status) { await api.put(`/provider/appointments/${id}/status`, { status }); await this.loadAppointments() }
  }
}
</script>
