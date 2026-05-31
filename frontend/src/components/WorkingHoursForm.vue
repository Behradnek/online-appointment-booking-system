<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">برنامه هفتگی</p>
        <h2>ساعات کاری</h2>
      </div>
    </div>
    <form @submit.prevent="save">
      <div class="hours-grid">
        <div v-for="day in days" :key="day.dayOfWeek" class="hours-row">
          <label class="check-row day-label">
            <input v-model="day.enabled" type="checkbox" />
            {{ day.label }}
          </label>
          <input v-model="day.startTime" type="time" :disabled="!day.enabled" />
          <input v-model="day.endTime" type="time" :disabled="!day.enabled" />
          <select v-model="day.slotDuration" :disabled="!day.enabled">
            <option :value="30">۳۰ دقیقه</option>
            <option :value="45">۴۵ دقیقه</option>
            <option :value="60">۶۰ دقیقه</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="button">ذخیره ساعات کاری</button>
      </div>
    </form>
    <p v-if="message" class="notice success">{{ message }}</p>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  data() {
    return {
      message: '',
      days: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((label, dayOfWeek) => ({
        dayOfWeek,
        label,
        enabled: false,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
      }))
    }
  },
  async mounted() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const { data } = await api.get(`/working-hours/${user.id}`)
    data.forEach((saved) => {
      Object.assign(this.days[saved.day_of_week], {
        enabled: true,
        startTime: saved.start_time,
        endTime: saved.end_time,
        slotDuration: saved.slot_duration
      })
    })
  },
  methods: {
    async save() {
      const activeDays = this.days.filter((day) => day.enabled).map((day) => ({
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        slotDuration: Number(day.slotDuration)
      }))
      await api.post('/working-hours', activeDays)
      this.message = 'ساعات کاری ذخیره شد.'
    }
  }
}
</script>
