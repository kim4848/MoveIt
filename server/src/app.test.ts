import { describe, it, expect, beforeEach } from 'vitest'
import type { Hono } from 'hono'
import { createDb } from './db'
import { createApp } from './app'

function makeApp(): Hono {
  return createApp(createDb(':memory:'))
}

async function createMember(app: Hono, body: Record<string, unknown>) {
  const res = await app.request('/api/members', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  expect(res.status).toBe(201)
  return res.json() as Promise<any>
}

describe('members', () => {
  let app: Hono
  beforeEach(() => {
    app = makeApp()
  })

  it('creates, lists, updates and deletes members', async () => {
    const m = await createMember(app, {
      name: 'Ada',
      dailyTargetMinutes: 30,
      color: '#2f9e44',
    })
    expect(m.id).toBeTruthy()
    expect(m.name).toBe('Ada')
    expect(m.order).toBe(0)

    const list = await (await app.request('/api/members')).json()
    expect(list).toHaveLength(1)

    const upd = await app.request(`/api/members/${m.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada L.', dailyTargetMinutes: 45 }),
    })
    expect((await upd.json()).name).toBe('Ada L.')

    const del = await app.request(`/api/members/${m.id}`, { method: 'DELETE' })
    expect(del.status).toBe(204)
    expect(await (await app.request('/api/members')).json()).toHaveLength(0)
  })

  it('assigns increasing order to new members', async () => {
    const a = await createMember(app, { name: 'A', dailyTargetMinutes: 15, color: '#000' })
    const b = await createMember(app, { name: 'B', dailyTargetMinutes: 15, color: '#111' })
    expect(a.order).toBe(0)
    expect(b.order).toBe(1)
  })
})

describe('entries + week', () => {
  let app: Hono
  let memberId: string
  beforeEach(async () => {
    app = makeApp()
    const m = await createMember(app, {
      name: 'Ada',
      dailyTargetMinutes: 30,
      color: '#2f9e44',
    })
    memberId = m.id
  })

  it('toggles a circle and reflects it in the week view', async () => {
    await app.request('/api/entries', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memberId, date: '2026-06-08', completed: true, together: true }),
    })

    const week = await (await app.request('/api/week/2026-W24')).json()
    expect(week.entries).toHaveLength(1)
    expect(week.entries[0]).toMatchObject({ memberId, date: '2026-06-08', completed: true, together: true })
  })

  it('removes an entry when toggled off with no activity/together', async () => {
    const put = (body: Record<string, unknown>) =>
      app.request('/api/entries', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    await put({ memberId, date: '2026-06-08', completed: true, together: false })
    await put({ memberId, date: '2026-06-08', completed: false, together: false })

    const week = await (await app.request('/api/week/2026-W24')).json()
    expect(week.entries).toHaveLength(0)
  })

  it('computes personal + family achievements for the week', async () => {
    // personligt mål = 2 for ugen
    await app.request('/api/week/2026-W24', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        weekGoal: { description: 'Ud hver dag', familyBonus: 'Biograf' },
        memberWeek: [{ memberId, targetCircles: 2, personalBonus: 'Is' }],
      }),
    })
    const put = (date: string) =>
      app.request('/api/entries', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ memberId, date, completed: true, together: false }),
      })
    await put('2026-06-08')
    await put('2026-06-09')

    const week = await (await app.request('/api/week/2026-W24')).json()
    expect(week.weekGoal).toMatchObject({ description: 'Ud hver dag', familyBonus: 'Biograf' })
    expect(week.achievements.perMember[memberId]).toMatchObject({ completed: 2, target: 2, reached: true })
    expect(week.achievements.familyReached).toBe(true)
  })
})

describe('week init', () => {
  let app: Hono
  let memberId: string
  beforeEach(async () => {
    app = makeApp()
    const m = await createMember(app, {
      name: 'Ada',
      dailyTargetMinutes: 30,
      color: '#2f9e44',
      defaultTargetCircles: 5,
    })
    memberId = m.id
  })

  it('init blank seeds member_week from default target', async () => {
    await app.request('/api/week/2026-W24/init?from=blank', { method: 'POST' })
    const week = await (await app.request('/api/week/2026-W24')).json()
    expect(week.memberWeek).toHaveLength(1)
    expect(week.memberWeek[0]).toMatchObject({ memberId, targetCircles: 5 })
  })

  it('init copy clones the previous week plan', async () => {
    await app.request('/api/week/2026-W23', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        weekGoal: { description: 'Forrige', familyBonus: 'Pizza' },
        memberWeek: [{ memberId, targetCircles: 3, personalBonus: 'Slik' }],
      }),
    })
    await app.request('/api/week/2026-W24/init?from=copy', { method: 'POST' })
    const week = await (await app.request('/api/week/2026-W24')).json()
    expect(week.weekGoal).toMatchObject({ description: 'Forrige', familyBonus: 'Pizza' })
    expect(week.memberWeek[0]).toMatchObject({ memberId, targetCircles: 3, personalBonus: 'Slik' })
  })
})
