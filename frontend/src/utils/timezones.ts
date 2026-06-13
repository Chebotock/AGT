export const TIMEZONES = [
  { value: 'Europe/Moscow',     label: 'Москва (UTC+3)' },
  { value: 'Europe/Kaliningrad',label: 'Калининград (UTC+2)' },
  { value: 'Europe/Samara',     label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg',label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk',         label: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk',  label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk',      label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk',      label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok',  label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan',      label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka',    label: 'Камчатка (UTC+12)' },
  { value: 'Europe/Kiev',       label: 'Киев (UTC+2)' },
  { value: 'Europe/Minsk',      label: 'Брест (UTC+3)' },
  { value: 'Asia/Almaty',       label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent',     label: 'Ташкент (UTC+5)' },
  { value: 'UTC',               label: 'UTC (UTC+0)' },
  { value: 'Europe/London',     label: 'Лондон (UTC+0/+1)' },
  { value: 'Europe/Berlin',     label: 'Берлин (UTC+1/+2)' },
  { value: 'America/New_York',  label: 'Нью-Йорк (UTC-5/-4)' },
  { value: 'America/Los_Angeles',label: 'Лос-Анджелес (UTC-8/-7)' },
]

// Форматировать дату в локальном времени часового пояса
export function formatInTimezone(date: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

// Получить текущее время в формате datetime-local для input
export function getLocalDatetimeValue(timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  return formatter.format(now).replace(' ', 'T')
}

// Конвертировать локальное время в UTC ISO string
export function localToUTC(localDatetime: string, timezone: string): string {
  // Парсим как локальное время и конвертируем в UTC
  const [datePart, timePart] = localDatetime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  
  // Используем Intl для получения offset
  const testDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const localStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(testDate)
  
  // Итерируем чтобы найти правильный UTC
  const target = new Date(`${datePart}T${timePart}:00`)
  const offset = testDate.getTime() - new Date(localStr.replace(', ', 'T')).getTime()
  return new Date(target.getTime() - offset).toISOString()
}
