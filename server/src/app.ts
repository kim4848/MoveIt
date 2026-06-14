import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import type { DB } from './db'
import type { Member, WeekGoal, MemberWeek, Entry } from './types'
import { weekDates, dateToWeekKey } from './lib/week'
import { computeAchievements } from './lib/achievements'

// --- row -> API mappers ---
type MemberRow = {
  id: string
  name: string
  daily_target_minutes: number
  color: string
  sort_order: number
  default_target_circles: number | null
}
const toMember = (r: MemberRow): Member => ({
  id: r.id,
  name: r.name,
  dailyTargetMinutes: r.daily_target_minutes,
  color: r.color,
  order: r.sort_order,
  defaultTargetCircles: r.default_target_circles,
})

type EntryRow = {
  id: string
  member_id: string
  date: string
  completed: number
  activity: string | null
  together: number
}
const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  memberId: r.member_id,
  date: r.date,
  completed: !!r.completed,
  activity: r.activity,
  together: !!r.together,
})

function prevWeekKey(weekKey: string): string {
  const monday = weekDates(weekKey)[0]
  const d = new Date(`${monday}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return dateToWeekKey(d.toISOString().slice(0, 10))
}

export function createApp(db: DB): Hono {
  const app = new Hono()

  // --- Members ---
  app.get('/api/members', (c) => {
    const rows = db
      .prepare('SELECT * FROM members ORDER BY sort_order')
      .all() as MemberRow[]
    return c.json(rows.map(toMember))
  })

  app.post('/api/members', async (c) => {
    const b = await c.req.json()
    const id = nanoid()
    const order =
      (db.prepare('SELECT COALESCE(MAX(sort_order) + 1, 0) AS n FROM members').get() as {
        n: number
      }).n
    db.prepare(
      `INSERT INTO members (id, name, daily_target_minutes, color, sort_order, default_target_circles)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      b.name,
      b.dailyTargetMinutes,
      b.color,
      order,
      b.defaultTargetCircles ?? null,
    )
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
    return c.json(toMember(row), 201)
  })

  app.put('/api/members/:id', async (c) => {
    const id = c.req.param('id')
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as
      | MemberRow
      | undefined
    if (!existing) return c.json({ error: 'not found' }, 404)
    const b = await c.req.json()
    db.prepare(
      `UPDATE members SET name = ?, daily_target_minutes = ?, color = ?, sort_order = ?, default_target_circles = ?
       WHERE id = ?`,
    ).run(
      b.name ?? existing.name,
      b.dailyTargetMinutes ?? existing.daily_target_minutes,
      b.color ?? existing.color,
      b.order ?? existing.sort_order,
      b.defaultTargetCircles ?? existing.default_target_circles,
      id,
    )
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
    return c.json(toMember(row))
  })

  app.delete('/api/members/:id', (c) => {
    db.prepare('DELETE FROM members WHERE id = ?').run(c.req.param('id'))
    return c.body(null, 204)
  })

  // --- Entries (upsert / delete-on-clear) ---
  app.put('/api/entries', async (c) => {
    const b = await c.req.json()
    const { memberId, date } = b
    const completed = !!b.completed
    const together = !!b.together
    const activity: string | null = b.activity ?? null

    if (!completed && !together && !activity) {
      db.prepare('DELETE FROM entries WHERE member_id = ? AND date = ?').run(memberId, date)
      return c.json({ deleted: true })
    }

    const existing = db
      .prepare('SELECT id FROM entries WHERE member_id = ? AND date = ?')
      .get(memberId, date) as { id: string } | undefined
    const id = existing?.id ?? nanoid()
    db.prepare(
      `INSERT INTO entries (id, member_id, date, completed, activity, together)
       VALUES (@id, @memberId, @date, @completed, @activity, @together)
       ON CONFLICT(member_id, date) DO UPDATE SET
         completed = @completed, activity = @activity, together = @together`,
    ).run({
      id,
      memberId,
      date,
      completed: completed ? 1 : 0,
      activity,
      together: together ? 1 : 0,
    })
    const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRow
    return c.json(toEntry(row))
  })

  // --- Week view (goal + member_week + entries + achievements) ---
  app.get('/api/week/:weekKey', (c) => {
    const weekKey = c.req.param('weekKey')
    const dates = weekDates(weekKey)

    const goalRow = db
      .prepare(
        'SELECT description, family_bonus, family_target_circles FROM week_goals WHERE week_key = ?',
      )
      .get(weekKey) as
      | { description: string | null; family_bonus: string | null; family_target_circles: number | null }
      | undefined
    const weekGoal: WeekGoal | null = goalRow
      ? {
          description: goalRow.description,
          familyBonus: goalRow.family_bonus,
          familyTargetCircles: goalRow.family_target_circles,
        }
      : null

    const mwRows = db
      .prepare(
        'SELECT member_id, target_circles, personal_bonus FROM member_week WHERE week_key = ?',
      )
      .all(weekKey) as {
      member_id: string
      target_circles: number | null
      personal_bonus: string | null
    }[]
    const memberWeek: MemberWeek[] = mwRows.map((r) => ({
      memberId: r.member_id,
      targetCircles: r.target_circles,
      personalBonus: r.personal_bonus,
    }))

    const entryRows = db
      .prepare(
        `SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date`,
      )
      .all(dates[0], dates[6]) as EntryRow[]
    const entries = entryRows.map(toEntry)

    const members = db.prepare('SELECT id FROM members').all() as { id: string }[]
    const targetByMember = new Map(memberWeek.map((m) => [m.memberId, m.targetCircles]))
    const completedByMember: Record<string, number> = {}
    for (const e of entries) {
      if (e.completed) completedByMember[e.memberId] = (completedByMember[e.memberId] ?? 0) + 1
    }
    const achievements = computeAchievements({
      members: members.map((m) => ({
        id: m.id,
        targetCircles: targetByMember.get(m.id) ?? null,
      })),
      completedByMember,
      familyTargetCircles: weekGoal?.familyTargetCircles ?? null,
    })

    return c.json({ weekKey, weekGoal, memberWeek, entries, achievements })
  })

  // --- Week plan upsert (goal + per-member targets/bonus) ---
  app.put('/api/week/:weekKey', async (c) => {
    const weekKey = c.req.param('weekKey')
    const b = await c.req.json()
    const tx = db.transaction(() => {
      if (b.weekGoal) {
        db.prepare(
          `INSERT INTO week_goals (week_key, description, family_bonus, family_target_circles)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(week_key) DO UPDATE SET description = excluded.description, family_bonus = excluded.family_bonus, family_target_circles = excluded.family_target_circles`,
        ).run(
          weekKey,
          b.weekGoal.description ?? null,
          b.weekGoal.familyBonus ?? null,
          b.weekGoal.familyTargetCircles ?? null,
        )
      }
      for (const mw of b.memberWeek ?? []) {
        db.prepare(
          `INSERT INTO member_week (week_key, member_id, target_circles, personal_bonus)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(week_key, member_id) DO UPDATE SET target_circles = excluded.target_circles, personal_bonus = excluded.personal_bonus`,
        ).run(weekKey, mw.memberId, mw.targetCircles ?? null, mw.personalBonus ?? null)
      }
    })
    tx()
    return c.json({ ok: true })
  })

  // --- Init a week: blank (from member defaults) or copy (from previous week) ---
  app.post('/api/week/:weekKey/init', (c) => {
    const weekKey = c.req.param('weekKey')
    const from = c.req.query('from') ?? 'blank'

    const tx = db.transaction(() => {
      if (from === 'copy') {
        const prev = prevWeekKey(weekKey)
        const prevGoal = db
          .prepare(
            'SELECT description, family_bonus, family_target_circles FROM week_goals WHERE week_key = ?',
          )
          .get(prev) as
          | { description: string | null; family_bonus: string | null; family_target_circles: number | null }
          | undefined
        db.prepare(
          `INSERT INTO week_goals (week_key, description, family_bonus, family_target_circles) VALUES (?, ?, ?, ?)
           ON CONFLICT(week_key) DO UPDATE SET description = excluded.description, family_bonus = excluded.family_bonus, family_target_circles = excluded.family_target_circles`,
        ).run(
          weekKey,
          prevGoal?.description ?? null,
          prevGoal?.family_bonus ?? null,
          prevGoal?.family_target_circles ?? null,
        )

        const prevMw = db
          .prepare(
            'SELECT member_id, target_circles, personal_bonus FROM member_week WHERE week_key = ?',
          )
          .all(prev) as {
          member_id: string
          target_circles: number | null
          personal_bonus: string | null
        }[]
        for (const mw of prevMw) {
          db.prepare(
            `INSERT INTO member_week (week_key, member_id, target_circles, personal_bonus) VALUES (?, ?, ?, ?)
             ON CONFLICT(week_key, member_id) DO UPDATE SET target_circles = excluded.target_circles, personal_bonus = excluded.personal_bonus`,
          ).run(weekKey, mw.member_id, mw.target_circles, mw.personal_bonus)
        }
      } else {
        db.prepare(
          `INSERT INTO week_goals (week_key, description, family_bonus) VALUES (?, NULL, NULL)
           ON CONFLICT(week_key) DO NOTHING`,
        ).run(weekKey)
        const members = db
          .prepare('SELECT id, default_target_circles FROM members')
          .all() as { id: string; default_target_circles: number | null }[]
        for (const m of members) {
          db.prepare(
            `INSERT INTO member_week (week_key, member_id, target_circles, personal_bonus) VALUES (?, ?, ?, NULL)
             ON CONFLICT(week_key, member_id) DO NOTHING`,
          ).run(weekKey, m.id, m.default_target_circles)
        }
      }
    })
    tx()
    return c.json({ ok: true })
  })

  // --- Settings (key/value, e.g. family name) ---
  app.get('/api/settings', (c) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as {
      key: string
      value: string
    }[]
    const obj: Record<string, string> = {}
    for (const r of rows) obj[r.key] = r.value
    return c.json(obj)
  })

  app.put('/api/settings', async (c) => {
    const b = (await c.req.json()) as Record<string, string>
    const tx = db.transaction(() => {
      for (const [key, value] of Object.entries(b)) {
        db.prepare(
          `INSERT INTO settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        ).run(key, value)
      }
    })
    tx()
    return c.json({ ok: true })
  })

  return app
}
