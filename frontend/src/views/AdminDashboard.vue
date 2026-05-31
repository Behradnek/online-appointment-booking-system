<template>
  <div>
    <section class="dashboard-header">
      <div><p class="eyebrow">پنل مدیریت</p><h1>کنترل کاربران و خدمات</h1></div>
      <div class="metric"><strong>{{ pendingRequests.length }}</strong><span>درخواست در انتظار</span></div>
    </section>

    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">خدمات پیشنهادی</p><h2>درخواست‌های ارائه‌دهندگان</h2></div><button class="button button-light" @click="loadRequests">به‌روزرسانی</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ارائه‌دهنده</th><th>خدمت</th><th>دسته</th><th>مدت</th><th>قیمت</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            <tr v-for="item in requests" :key="item.id">
              <td>{{ item.provider_name }} {{ item.provider_family }}</td><td>{{ item.name }}</td><td>{{ item.category_name }}</td><td>{{ item.estimated_duration }} دقیقه</td><td>{{ money(item.suggested_price) }}</td><td>{{ item.status }}</td>
              <td class="action-row"><button v-if="item.status === 'pending'" class="button small" @click="approve(item)">تایید</button><button v-if="item.status === 'pending'" class="button button-danger small" @click="reject(item)">رد</button></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!requests.length" class="empty">درخواستی ثبت نشده است.</p>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">دسترسی‌ها</p><h2>کاربران سامانه</h2></div><button class="button button-light" @click="loadUsers">به‌روزرسانی</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>نام</th><th>ایمیل</th><th>موبایل</th><th>نقش</th><th>وضعیت</th><th></th></tr></thead>
          <tbody><tr v-for="item in users" :key="item.id"><td>{{ item.name }} {{ item.family }}</td><td dir="ltr">{{ item.email }}</td><td dir="ltr">{{ item.phone }}</td><td>{{ item.role }}</td><td>{{ item.is_active ? 'فعال' : 'غیرفعال' }}</td><td><button v-if="item.role !== 'admin'" class="button small" :class="{ 'button-danger': item.is_active }" @click="toggle(item.id)">{{ item.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}</button></td></tr></tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  data() { return { requests: [], users: [] } },
  computed: { pendingRequests() { return this.requests.filter((item) => item.status === 'pending') } },
  async mounted() { await Promise.all([this.loadRequests(), this.loadUsers()]) },
  methods: {
    money(value) { return Number(value).toLocaleString('fa-IR') },
    async loadRequests() { this.requests = (await api.get('/admin/service-requests')).data },
    async loadUsers() { this.users = (await api.get('/admin/users')).data },
    async approve(item) {
      const finalPrice = window.prompt('قیمت نهایی را وارد کنید:', item.suggested_price)
      const finalDuration = window.prompt('مدت نهایی را وارد کنید:', item.estimated_duration)
      if (!finalPrice || !finalDuration) return
      await api.put(`/admin/service-requests/${item.id}/approve`, { finalPrice: Number(finalPrice), finalDuration: Number(finalDuration) })
      await this.loadRequests()
    },
    async reject(item) {
      const rejectReason = window.prompt('علت رد درخواست را وارد کنید:')
      if (!rejectReason) return
      await api.put(`/admin/service-requests/${item.id}/reject`, { rejectReason })
      await this.loadRequests()
    },
    async toggle(id) { await api.put(`/admin/users/${id}/toggle-status`); await this.loadUsers() }
  }
}
</script>
