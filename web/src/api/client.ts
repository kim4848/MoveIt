import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Member,
  MemberInput,
  EntryInput,
  WeekData,
  WeekGoal,
  MemberWeek,
} from './types'

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// --- Members ---
export function useMembers() {
  return useQuery({ queryKey: ['members'], queryFn: () => http<Member[]>('/api/members') })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MemberInput) =>
      http<Member>('/api/members', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<MemberInput> & { id: string }) =>
      http<Member>(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['week'] })
    },
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => http<void>(`/api/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['week'] })
    },
  })
}

// --- Week ---
export function useWeek(weekKey: string) {
  return useQuery({
    queryKey: ['week', weekKey],
    queryFn: () => http<WeekData>(`/api/week/${weekKey}`),
  })
}

export function useSetEntry(weekKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EntryInput) =>
      http('/api/entries', { method: 'PUT', body: JSON.stringify(input) }),
    // Optimistisk: opdater cellen straks, så toggles føles snappy på tabletten.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['week', weekKey] })
      const prev = qc.getQueryData<WeekData>(['week', weekKey])
      if (prev) {
        const others = prev.entries.filter(
          (e) => !(e.memberId === input.memberId && e.date === input.date),
        )
        const keep = input.completed || input.together || !!input.activity
        const next: WeekData = {
          ...prev,
          entries: keep
            ? [
                ...others,
                {
                  id: 'optimistic',
                  memberId: input.memberId,
                  date: input.date,
                  completed: input.completed,
                  activity: input.activity ?? null,
                  together: input.together,
                },
              ]
            : others,
        }
        qc.setQueryData(['week', weekKey], next)
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['week', weekKey], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['week', weekKey] }),
  })
}

export interface WeekPlanInput {
  weekGoal: WeekGoal
  memberWeek: MemberWeek[]
}

export function useSaveWeekPlan(weekKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WeekPlanInput) =>
      http(`/api/week/${weekKey}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['week', weekKey] }),
  })
}

export function useInitWeek(weekKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (from: 'blank' | 'copy') =>
      http(`/api/week/${weekKey}/init?from=${from}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['week', weekKey] }),
  })
}

// --- Settings ---
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => http<Record<string, string>>('/api/settings'),
  })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, string>) =>
      http('/api/settings', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

// Positiv liste over aktiviteter der tæller (fodbold, cykling, ...). Gemt i settings som JSON.
export function useActivities(): string[] {
  const { data } = useSettings()
  try {
    const parsed = JSON.parse(data?.activities ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useSaveActivities() {
  const save = useSaveSettings()
  return {
    ...save,
    save: (activities: string[]) => save.mutate({ activities: JSON.stringify(activities) }),
  }
}
