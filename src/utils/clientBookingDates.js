/** Client trip requests: bookable only within this many days from "now". */
export const CLIENT_BOOKING_WINDOW_DAYS = 14

/** Format a Date for local datetime strings used by the API / inputs. */
export function toDatetimeLocalString(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Trip start must be >= now and on/before end of the calendar day that is
 * `CLIENT_BOOKING_WINDOW_DAYS` days after today (local). Clients can pick any
 * future date in that range from the start date picker.
 */
export function getClientBookingWindowBounds() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastBookableDay = new Date(startOfToday)
  lastBookableDay.setDate(lastBookableDay.getDate() + CLIENT_BOOKING_WINDOW_DAYS)
  lastBookableDay.setHours(23, 59, 0, 0)
  return {
    min: toDatetimeLocalString(now),
    max: toDatetimeLocalString(lastBookableDay),
    minDate: now,
    maxDate: lastBookableDay,
  }
}

/** Pretty label for a `YYYY-MM-DD` string in the user's locale. */
export function formatYmdForDisplay(ymd) {
  if (!ymd || ymd.length < 10) return ''
  const [y, m, d] = ymd.slice(0, 10).split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Parse `YYYY-MM-DDTHH:mm` into date + time parts for split inputs. */
export function splitDateTimeLocal(s) {
  if (!s || typeof s !== 'string') return { date: '', time: '' }
  const i = s.indexOf('T')
  if (i === -1) return { date: s.slice(0, 10), time: '' }
  return { date: s.slice(0, i), time: s.slice(i + 1, i + 6) }
}

const DEFAULT_TIME = '09:00'

/** Build `YYYY-MM-DDTHH:mm` from native date + time inputs. */
export function joinDateTimeLocal(dateStr, timeStr) {
  if (!dateStr) return ''
  const t =
    timeStr && /^\d{1,2}:\d{2}$/.test(timeStr.trim())
      ? (() => {
          const [h, m] = timeStr.trim().split(':')
          return `${String(Math.min(23, parseInt(h, 10) || 0)).padStart(2, '0')}:${String(Math.min(59, parseInt(m, 10) || 0)).padStart(2, '0')}`
        })()
      : DEFAULT_TIME
  return `${dateStr}T${t}`
}

/**
 * Validate at submit time (uses a fresh "now").
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateClientBookingRange(startStr, endStr) {
  const { minDate: now, maxDate: maxStart } = getClientBookingWindowBounds()
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, message: 'Invalid start or end date/time' }
  }
  if (start < now) {
    return { ok: false, message: 'Start date/time cannot be in the past' }
  }
  if (end <= start) {
    return { ok: false, message: 'End date/time must be after start date/time' }
  }
  if (start > maxStart) {
    return {
      ok: false,
      message: `Trip start must be within the next ${CLIENT_BOOKING_WINDOW_DAYS} days from today`,
    }
  }
  return { ok: true }
}
