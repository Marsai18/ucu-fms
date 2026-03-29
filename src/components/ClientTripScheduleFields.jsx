import React from 'react'
import { Calendar, Clock } from 'lucide-react'
import {
  CLIENT_BOOKING_WINDOW_DAYS,
  splitDateTimeLocal,
  joinDateTimeLocal,
  formatYmdForDisplay,
} from '../utils/clientBookingDates'

/**
 * Split date + time inputs (avoids native datetime-local scroll/focus bugs in scrollable layouts).
 * Parent owns clamping via onStartChange / onEndChange (full `YYYY-MM-DDTHH:mm` strings).
 */
export default function ClientTripScheduleFields({
  bookingBounds,
  startDateTime,
  endDateTime,
  onStartChange,
  onEndChange,
  fieldClassName = '',
  labelRowClassName = 'text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client',
}) {
  const sd = splitDateTimeLocal(startDateTime)
  const ed = splitDateTimeLocal(endDateTime)
  const minDay = bookingBounds.min.slice(0, 10)
  const maxDay = bookingBounds.max.slice(0, 10)
  const minHM = bookingBounds.min.slice(11, 16)
  const maxHM = bookingBounds.max.slice(11, 16)

  const startTimeMin = sd.date === minDay ? minHM : undefined
  const startTimeMax = sd.date === maxDay ? maxHM : undefined

  const endDayMin = startDateTime ? startDateTime.slice(0, 10) : minDay

  const endTimeMin = (() => {
    if (!ed.date) return undefined
    if (startDateTime && ed.date === startDateTime.slice(0, 10)) {
      return startDateTime.slice(11, 16)
    }
    return undefined
  })()

  const inner = 'w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="min-w-0 space-y-2">
        <span className={labelRowClassName}>
          <Calendar size={16} className="text-ucu-blue-500 shrink-0" /> Trip start
        </span>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            aria-label={`Trip start date, between ${formatYmdForDisplay(minDay)} and ${formatYmdForDisplay(maxDay)}`}
            value={sd.date}
            min={minDay}
            max={maxDay}
            onChange={(e) => onStartChange(joinDateTimeLocal(e.target.value, sd.time))}
            className={`${inner} ${fieldClassName}`}
          />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400 shrink-0" aria-hidden />
            <input
              type="time"
              aria-label="Start time"
              value={sd.time}
              min={startTimeMin}
              max={startTimeMax}
              disabled={!sd.date}
              onChange={(e) => onStartChange(joinDateTimeLocal(sd.date, e.target.value))}
              className={`${inner} flex-1 min-w-0 ${fieldClassName} disabled:opacity-50`}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a <span className="font-semibold text-slate-600 dark:text-slate-300">future</span> start: any date from{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{formatYmdForDisplay(minDay)}</span> to{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{formatYmdForDisplay(maxDay)}</span>{' '}
          ({CLIENT_BOOKING_WINDOW_DAYS} days from today, local). Today’s time cannot be earlier than now; on the last day,
          time is limited to the end of the booking window.
        </p>
      </div>

      <div className="min-w-0 space-y-2">
        <span className={labelRowClassName}>
          <Calendar size={16} className="text-ucu-blue-500 shrink-0" /> Trip end
        </span>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            aria-label="End date"
            value={ed.date}
            min={endDayMin}
            onChange={(e) => onEndChange(joinDateTimeLocal(e.target.value, ed.time))}
            className={`${inner} ${fieldClassName}`}
          />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400 shrink-0" aria-hidden />
            <input
              type="time"
              aria-label="End time"
              value={ed.time}
              min={endTimeMin}
              disabled={!ed.date}
              onChange={(e) => onEndChange(joinDateTimeLocal(ed.date, e.target.value))}
              className={`${inner} flex-1 min-w-0 ${fieldClassName} disabled:opacity-50`}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Any end date and time after start — multi-day trips are fine
        </p>
      </div>
    </div>
  )
}
