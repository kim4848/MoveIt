import { Fragment } from 'react'
import { Text } from '@mantine/core'
import { IconStarFilled } from '@tabler/icons-react'
import type { Member, WeekData } from '../api/types'
import { useSetEntry, useActivities } from '../api/client'
import { weekDays } from '../lib/isoWeek'
import { CircleCell } from './CircleCell'
import { ActivityIdeas } from './ActivityIdeas'
import classes from './WeekGrid.module.css'

export interface WeekGridProps {
  weekKey: string
  members: Member[]
  week: WeekData
}

export function WeekGrid({ weekKey, members, week }: WeekGridProps) {
  const days = weekDays(weekKey)
  const setEntry = useSetEntry(weekKey)
  const suggestions = useActivities()

  const entryFor = (memberId: string, date: string) =>
    week.entries.find((e) => e.memberId === memberId && e.date === date)

  return (
    <div className={classes.scroll}>
      <div className={classes.grid}>
        {/* header */}
        <div className={`${classes.headCell} ${classes.cornerCell}`} />
        {days.map((d) => (
          <div key={d.iso} className={classes.headCell}>
            {d.weekday}
            <div className={classes.headDate}>{d.dayMonth}</div>
          </div>
        ))}

        {members.map((m) => {
          const ach = week.achievements.perMember[m.id]
          const reached = ach?.reached
          return (
            <Fragment key={m.id}>
              <div className={classes.rowDivider} />
              <div className={classes.memberCell}>
                <span className={classes.memberName}>
                  <span className={classes.swatch} style={{ background: m.color }} />
                  {m.name}
                </span>
                <Text size="xs" className={reached ? classes.reached : undefined} c={reached ? undefined : 'dimmed'}>
                  {ach?.completed ?? 0}
                  {ach?.target != null ? ` / ${ach.target}` : ''}{' '}
                  {(ach?.completed ?? 0) === 1 && ach?.target == null ? 'cirkel' : 'cirkler'}
                  {reached ? ' ✓' : ''}
                </Text>
              </div>

              {days.map((d) => {
                const entry = entryFor(m.id, d.iso)
                const completed = entry?.completed ?? false
                const together = entry?.together ?? false
                const activity = entry?.activity ?? null
                return (
                  <CircleCell
                    key={d.iso}
                    memberName={m.name}
                    dayLabel={`${d.weekday} ${d.dayMonth}`}
                    color={m.color}
                    completed={completed}
                    together={together}
                    activity={activity}
                    suggestions={suggestions}
                    onToggle={() =>
                      setEntry.mutate({
                        memberId: m.id,
                        date: d.iso,
                        completed: !completed,
                        activity,
                        together,
                      })
                    }
                    onSetMeta={(meta) =>
                      setEntry.mutate({
                        memberId: m.id,
                        date: d.iso,
                        completed,
                        activity: meta.activity,
                        together: meta.together,
                      })
                    }
                  />
                )
              })}
            </Fragment>
          )
        })}
      </div>

      {/* familie-stjerne-hint i en lille forklaring */}
      <Text size="xs" c="dimmed" mt="xs">
        <IconStarFilled size={11} style={{ verticalAlign: 'middle', color: 'var(--mantine-color-yellow-6)' }} />{' '}
        = bevæget jer sammen
      </Text>

      <ActivityIdeas />
    </div>
  )
}
