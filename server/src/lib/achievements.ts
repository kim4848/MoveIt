// Afledt opnået-status (lagres ikke). Bruges af både UI og print, så de viser samme sandhed.

export interface AchievementInput {
  members: { id: string; targetCircles: number | null }[]
  completedByMember: Record<string, number>
  // Fælles mål: X cirkler som HVER person skal nå for at udløse den fælles bonus.
  // Når sat, bestemmer det familyReached i stedet for de personlige mål.
  familyTargetCircles?: number | null
}

export interface MemberAchievement {
  completed: number
  target: number | null
  reached: boolean
}

export interface Achievements {
  perMember: Record<string, MemberAchievement>
  familyReached: boolean
}

function hasGoal(target: number | null): target is number {
  return target != null && target > 0
}

export function computeAchievements(input: AchievementInput): Achievements {
  const perMember: Record<string, MemberAchievement> = {}

  for (const m of input.members) {
    const completed = input.completedByMember[m.id] ?? 0
    const reached = hasGoal(m.targetCircles) && completed >= m.targetCircles
    perMember[m.id] = { completed, target: m.targetCircles, reached }
  }

  let familyReached: boolean
  if (hasGoal(input.familyTargetCircles ?? null)) {
    // Fælles mål sat: ALLE skal have mindst X cirkler.
    const x = input.familyTargetCircles as number
    familyReached =
      input.members.length > 0 &&
      input.members.every((m) => perMember[m.id].completed >= x)
  } else {
    // Fald tilbage: alle medlemmer der HAR et personligt mål skal have nået det.
    const withGoal = input.members.filter((m) => hasGoal(m.targetCircles))
    familyReached = withGoal.length > 0 && withGoal.every((m) => perMember[m.id].reached)
  }

  return { perMember, familyReached }
}
