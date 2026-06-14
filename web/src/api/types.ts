export interface Member {
  id: string
  name: string
  dailyTargetMinutes: number
  color: string
  order: number
  defaultTargetCircles: number | null
}

export interface WeekGoal {
  description: string | null
  familyBonus: string | null
  familyTargetCircles: number | null
}

export interface MemberWeek {
  memberId: string
  targetCircles: number | null
  personalBonus: string | null
}

export interface Entry {
  id: string
  memberId: string
  date: string
  completed: boolean
  activity: string | null
  together: boolean
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

export interface WeekData {
  weekKey: string
  weekGoal: WeekGoal | null
  memberWeek: MemberWeek[]
  entries: Entry[]
  achievements: Achievements
}

export interface MemberInput {
  name: string
  dailyTargetMinutes: number
  color: string
  defaultTargetCircles?: number | null
  order?: number
}

export interface EntryInput {
  memberId: string
  date: string
  completed: boolean
  activity?: string | null
  together: boolean
}
