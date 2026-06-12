export const TIMEZONES = [
  { value: 'Europe/Moscow',      label: 'Москва (UTC+3)' },
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
  { value: 'Europe/Samara',      label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk',          label: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk',   label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk',       label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk',       label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok',   label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan',       label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka',     label: 'Камчатка (UTC+12)' },
  { value: 'Europe/Kiev',        label: 'Киев (UTC+2/3)' },
  { value: 'Asia/Almaty',        label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent',      label: 'Ташкент (UTC+5)' },
  { value: 'Asia/Tbilisi',       label: 'Тбилиси (UTC+4)' },
  { value: 'Europe/Minsk',       label: 'Минск (UTC+3)' },
  { value: 'UTC',                label: 'UTC (UTC+0)' },
  { value: 'Europe/London',      label: 'Лондон (UTC+0/1)' },
  { value: 'Europe/Berlin',      label: 'Берлин (UTC+1/2)' },
  { value: 'America/New_York',   label: 'Нью-Йорк (UTC-5/-4)' },
]

// Конвертировать локальное время в часовом поясе в UTC ISO строку
export function localToUTC(dateStr: string, timeStr: string, timezone: string): string {
  // Создаём дату как будто она в нужном поясе
  const localStr = `${dateStr}T${timeStr}:00`
  // Используем Intl для определения смещения
  const dt = new Date(localStr)
  const utcMs = dt.getTime() - getTimezoneOffset(timezone, dt) * 60000
  return new Date(utcMs).toISOString()
}

// Конвертировать UTC в локальное время часового пояса
export function utcToLocal(isoStr: string, timezone: string): { date: string; time: string } {
  const dt = new Date(isoStr)
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
  const parts = formatter.formatToParts(dt)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`
  }
}

function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return (tzDate.getTime() - utcDate.getTime()) / 60000
}

// Форматировать оставшееся время до старта
export function formatCountdown(scheduledAt: string, timezone: string): string {
  const now = Date.now()
  const target = new Date(scheduledAt).getTime()
  const diff = Math.max(0, Math.floor((target - now) / 1000))
  
  if (diff === 0) return 'Вот-вот начнётся!'
  
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  
  if (h > 0) return `${h} ч ${m} мин ${s} сек`
  if (m > 0) return `${m} мин ${s} сек`
  return `${s} сек`
}

// Показать время старта в нужном поясе
export function formatScheduledTime(isoStr: string, timezone: string): string {
  return new Date(isoStr).toLocaleString('ru-RU', {
    timeZone: timezone,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
