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
