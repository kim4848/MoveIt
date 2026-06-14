import { describe, it, expect } from 'vitest'
import { computeAchievements } from './achievements'

describe('computeAchievements — personlig', () => {
  it('marks a member reached when completed >= target', () => {
    const a = computeAchievements({
      members: [{ id: 'm1', targetCircles: 4 }],
      completedByMember: { m1: 4 },
    })
    expect(a.perMember.m1).toEqual({ completed: 4, target: 4, reached: true })
  })

  it('does not mark reached when below target', () => {
    const a = computeAchievements({
      members: [{ id: 'm1', targetCircles: 4 }],
      completedByMember: { m1: 3 },
    })
    expect(a.perMember.m1.reached).toBe(false)
  })

  it('a member with no target is never reached', () => {
    const a = computeAchievements({
      members: [{ id: 'm1', targetCircles: null }],
      completedByMember: { m1: 7 },
    })
    expect(a.perMember.m1).toEqual({ completed: 7, target: null, reached: false })
  })
})

describe('computeAchievements — fælles (alle i mål)', () => {
  it('is reached when every member with a goal has reached it', () => {
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: 4 },
        { id: 'm2', targetCircles: 6 },
      ],
      completedByMember: { m1: 4, m2: 6 },
    })
    expect(a.familyReached).toBe(true)
  })

  it('is not reached when one member is short', () => {
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: 4 },
        { id: 'm2', targetCircles: 6 },
      ],
      completedByMember: { m1: 4, m2: 5 },
    })
    expect(a.familyReached).toBe(false)
  })

  it('ignores members without a goal but still reaches if the goal-havers reached', () => {
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: 4 },
        { id: 'm2', targetCircles: null },
      ],
      completedByMember: { m1: 4, m2: 0 },
    })
    expect(a.familyReached).toBe(true)
  })

  it('is not reached when nobody has a goal', () => {
    const a = computeAchievements({
      members: [{ id: 'm1', targetCircles: null }],
      completedByMember: { m1: 7 },
    })
    expect(a.familyReached).toBe(false)
  })
})

describe('computeAchievements — fælles mål (X cirkler pr. person)', () => {
  it('is reached when every member has at least X circles', () => {
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: null },
        { id: 'm2', targetCircles: null },
      ],
      completedByMember: { m1: 5, m2: 6 },
      familyTargetCircles: 5,
    })
    expect(a.familyReached).toBe(true)
  })

  it('is not reached when one member is below X', () => {
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: null },
        { id: 'm2', targetCircles: null },
      ],
      completedByMember: { m1: 5, m2: 4 },
      familyTargetCircles: 5,
    })
    expect(a.familyReached).toBe(false)
  })

  it('the shared target overrides personal-goal-based family logic', () => {
    // m1 har nået sit personlige mål, m2 har ikke — men begge har >= 3 → fælles bonus opnået
    const a = computeAchievements({
      members: [
        { id: 'm1', targetCircles: 2 },
        { id: 'm2', targetCircles: 6 },
      ],
      completedByMember: { m1: 3, m2: 3 },
      familyTargetCircles: 3,
    })
    expect(a.familyReached).toBe(true)
  })

  it('falls back to personal-goal logic when familyTargetCircles is not set', () => {
    const a = computeAchievements({
      members: [{ id: 'm1', targetCircles: 4 }],
      completedByMember: { m1: 4 },
      familyTargetCircles: null,
    })
    expect(a.familyReached).toBe(true)
  })
})
