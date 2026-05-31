<template>
  <div>
    <label :for="id">تاریخ شمسی</label>
    <input
      :id="id"
      v-model="jalaliDate"
      inputmode="numeric"
      placeholder="۱۴۰۵/۰۳/۱۵"
      dir="ltr"
      @input="updateDate"
    />
    <small v-if="error" class="field-error">{{ error }}</small>
  </div>
</template>

<script>
import { toGregorian, toJalali } from '../utils/dateHelper'

export default {
  props: {
    modelValue: { type: String, default: '' },
    id: { type: String, default: 'persian-date' }
  },
  emits: ['update:modelValue'],
  data() {
    return { jalaliDate: toJalali(this.modelValue), error: '' }
  },
  watch: {
    modelValue(value) {
      if (value && toGregorian(this.jalaliDate) !== value) this.jalaliDate = toJalali(value)
    }
  },
  methods: {
    updateDate() {
      try {
        const gregorian = toGregorian(this.jalaliDate)
        this.error = gregorian ? '' : 'تاریخ را به شکل ۱۴۰۵/۰۳/۱۵ وارد کنید.'
        this.$emit('update:modelValue', gregorian)
      } catch {
        this.error = 'تاریخ شمسی معتبر نیست.'
        this.$emit('update:modelValue', '')
      }
    }
  }
}
</script>
