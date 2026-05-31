import { gregorianToJalali, jalaliToGregorian } from 'shamsi-date-converter'

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toGregorian(jalaliDate) {
  const [year, month, day] = jalaliDate.split('/').map(Number)
  if (!year || !month || !day) return ''
  const result = jalaliToGregorian(year, month, day)
  return `${result[0]}-${pad(result[1])}-${pad(result[2])}`
}

export function toJalali(gregorianDate) {
  if (!gregorianDate) return ''
  const [year, month, day] = gregorianDate.split('-').map(Number)
  const result = gregorianToJalali(year, month, day)
  return `${result[0]}/${pad(result[1])}/${pad(result[2])}`
}
