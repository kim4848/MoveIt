import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Button, SegmentedControl, Loader, Center } from '@mantine/core'
import { IconPrinter, IconArrowLeft } from '@tabler/icons-react'
import { useMembers, useWeek, useSettings, useActivities } from '../api/client'
import { weekDays, weekNumber, weekRangeLabel } from '../lib/isoWeek'
import '../print.css'

export function PrintView() {
  const { weekKey = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'blank' ? 'blank' : 'filled'

  const members = useMembers()
  const week = useWeek(weekKey)
  const settings = useSettings()
  const activities = useActivities()

  if (members.isLoading || week.isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  const days = weekDays(weekKey)
  const familyName = settings.data?.familyName
  const blank = mode === 'blank'

  const entryFor = (memberId: string, date: string) =>
    week.data?.entries.find((e) => e.memberId === memberId && e.date === date)

  return (
    <div className="printSheet">
      {/* Skærm-kontroller — skjules i print */}
      <div className="printControls no-print">
        <Button
          component={Link}
          to="/"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Tilbage
        </Button>
        <SegmentedControl
          value={mode}
          onChange={(v) => setParams({ mode: v })}
          data={[
            { label: 'Udfyldt', value: 'filled' },
            { label: 'Blank', value: 'blank' },
          ]}
        />
        <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="printHeader">
        <h1 className="printTitle">
          Bevægelsesuge{familyName ? ` — ${familyName}` : ''}
        </h1>
        <div>
          <strong>Uge {weekNumber(weekKey)}</strong> · {weekRangeLabel(weekKey)}
        </div>
      </div>
      <p className="printRule">
        Fyld en cirkel når du har bevæget dig dit antal minutter i ét sammenhængende stræk i
        fritiden — skole og SFO tæller ikke med.
      </p>

      <table className="printTable">
        <thead>
          <tr>
            <th className="nameCell">Navn</th>
            {days.map((d) => (
              <th key={d.iso}>
                {d.weekday}
                <div className="nameSub">{d.dayMonth}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(members.data ?? []).map((m) => (
            <tr key={m.id}>
              <td className="nameCell">
                {m.name}
                <div className="nameSub">{m.dailyTargetMinutes} min i træk</div>
              </td>
              {days.map((d) => {
                const e = entryFor(m.id, d.iso)
                const filled = !blank && !!e?.completed
                const together = !blank && !!e?.together
                return (
                  <td key={d.iso}>
                    <div
                      className={`pCircle${filled ? ' filled' : ''}`}
                      style={filled ? { background: m.color } : undefined}
                    >
                      {filled && <span className="pCheck">✓</span>}
                    </div>
                    <div className="pStar">{together ? '★' : blank ? '☆' : ' '}</div>
                    <div className="pActivity">{!blank && e?.activity ? e.activity : ' '}</div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mål + bonusser */}
      {(week.data?.weekGoal?.description ||
        week.data?.weekGoal?.familyBonus ||
        week.data?.memberWeek.some((mw) => mw.personalBonus || mw.targetCircles != null)) && (
        <div className="bonusGrid">
          {week.data?.weekGoal?.description && (
            <div className="bonusItem" style={{ gridColumn: '1 / -1' }}>
              <span>🎯 Ugens mål</span>
              <span>{week.data.weekGoal.description}</span>
            </div>
          )}
          {(members.data ?? []).map((m) => {
            const mw = week.data?.memberWeek.find((x) => x.memberId === m.id)
            if (!mw || (mw.personalBonus == null && mw.targetCircles == null)) return null
            const reached = !blank && week.data?.achievements.perMember[m.id]?.reached
            return (
              <div key={m.id} className="bonusItem">
                <span>
                  {m.name}
                  {mw.targetCircles != null ? ` · mål ${mw.targetCircles}` : ''}
                  {mw.personalBonus ? ` · ${mw.personalBonus}` : ''}
                </span>
                <span>{reached ? '✓ opnået' : '☐'}</span>
              </div>
            )
          })}
          {(week.data?.weekGoal?.familyBonus ||
            week.data?.weekGoal?.familyTargetCircles != null) && (
            <div className="bonusItem" style={{ gridColumn: '1 / -1' }}>
              <span>
                🏆 Fælles bonus
                {week.data?.weekGoal?.familyTargetCircles != null
                  ? ` (alle når ${week.data.weekGoal.familyTargetCircles} cirkler)`
                  : ' (når alle er i mål)'}
                {week.data?.weekGoal?.familyBonus ? ` · ${week.data.weekGoal.familyBonus}` : ''}
              </span>
              <span>{!blank && week.data?.achievements.familyReached ? '✓ opnået' : '☐'}</span>
            </div>
          )}
        </div>
      )}

      <div className="legend">
        <span>● = mål nået (cirkel fyldt)</span>
        <span>★ = bevæget jer sammen</span>
      </div>

      {activities.length > 0 && (
        <p className="printActivities">
          <strong>Idéer der tæller:</strong> {activities.join(' · ')}
        </p>
      )}
    </div>
  )
}
