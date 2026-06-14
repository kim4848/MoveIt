// ISO 8601 uge-håndtering. Datoer er "yyyy-mm-dd"; uge-nøgler er "YYYY-Www".
// Alt regnes i UTC for at undgå tidszone-skæv.

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** ISO uge-nummer + uge-år for en given dato. */
export function dateToWeekKey(date: string): string {
  const d = parseISODate(date)
  // Torsdag i samme uge bestemmer ISO-året.
  const dayNr = (d.getUTCDay() + 6) % 7 // man=0 .. søn=6
  const thursday = new Date(d)
  thursday.setUTCDate(d.getUTCDate() - dayNr + 3)
  const isoYear = thursday.getUTCFullYear()

  // Uge 1 er ugen der indeholder 4. januar.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const jan4DayNr = (jan4.getUTCDay() + 6) % 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNr)

  const mondayOfThisWeek = new Date(d)
  mondayOfThisWeek.setUTCDate(d.getUTCDate() - dayNr)

  const week =
    1 +
    Math.round(
      (mondayOfThisWeek.getTime() - week1Monday.getTime()) / (7 * 86_400_000),
    )

  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

/** De 7 ISO-datoer (mandag..søndag) for en uge-nøgle. */
export function weekDates(weekKey: string): string[] {
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)

  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4DayNr = (jan4.getUTCDay() + 6) % 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNr)

  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setUTCDate(monday.getUTCDate() + i)
    return toISODate(day)
  })
}
