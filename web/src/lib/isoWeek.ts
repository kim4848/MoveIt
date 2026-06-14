import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/da'

dayjs.extend(isoWeek)
dayjs.locale('da')

const WEEKDAYS_DA = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export function currentWeekKey(): string {
  return toWeekKey(dayjs())
}

function toWeekKey(d: dayjs.Dayjs): string {
  return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
}

/** Mandag i ISO-uge 1 af et år = mandagen i ugen der indeholder 4. januar. */
function mondayOf(weekKey: string): dayjs.Dayjs {
  const [year, week] = weekKey.split('-W').map(Number)
  return dayjs(`${year}-01-04`).isoWeekday(1).add(week - 1, 'week')
}

export function weekNumber(weekKey: string): number {
  return Number(weekKey.split('-W')[1])
}

export function addWeeks(weekKey: string, delta: number): string {
  return toWeekKey(mondayOf(weekKey).add(delta, 'week'))
}

export interface WeekDay {
  iso: string // yyyy-mm-dd
  weekday: string // "Man"
  dayMonth: string // "8/6"
}

export function weekDays(weekKey: string): WeekDay[] {
  const monday = mondayOf(weekKey)
  return Array.from({ length: 7 }, (_, i) => {
    const d = monday.add(i, 'day')
    return { iso: d.format('YYYY-MM-DD'), weekday: WEEKDAYS_DA[i], dayMonth: d.format('D/M') }
  })
}

/** "8.–14. juni 2026" til navigator/print. */
export function weekRangeLabel(weekKey: string): string {
  const monday = mondayOf(weekKey)
  const sunday = monday.add(6, 'day')
  if (monday.month() === sunday.month()) {
    return `${monday.format('D.')}–${sunday.format('D. MMMM YYYY')}`
  }
  return `${monday.format('D. MMM')}–${sunday.format('D. MMM YYYY')}`
}
