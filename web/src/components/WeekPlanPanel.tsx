import { useState } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Divider,
  Alert,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconGift, IconTrophy, IconPencil, IconSparkles, IconCopy } from '@tabler/icons-react'
import type { Member, WeekData } from '../api/types'
import { useSaveWeekPlan, useInitWeek, type WeekPlanInput } from '../api/client'

export interface WeekPlanPanelProps {
  weekKey: string
  members: Member[]
  week: WeekData
}

interface FormValues {
  description: string
  familyBonus: string
  familyTargetCircles: number | string
  members: { memberId: string; name: string; targetCircles: number | string; personalBonus: string }[]
}

export function WeekPlanPanel({ weekKey, members, week }: WeekPlanPanelProps) {
  const [editing, setEditing] = useState(false)
  const savePlan = useSaveWeekPlan(weekKey)
  const initWeek = useInitWeek(weekKey)

  const initialized = week.weekGoal !== null || week.memberWeek.length > 0

  const form = useForm<FormValues>({
    initialValues: {
      description: week.weekGoal?.description ?? '',
      familyBonus: week.weekGoal?.familyBonus ?? '',
      familyTargetCircles: week.weekGoal?.familyTargetCircles ?? '',
      members: members.map((m) => {
        const mw = week.memberWeek.find((x) => x.memberId === m.id)
        return {
          memberId: m.id,
          name: m.name,
          targetCircles: mw?.targetCircles ?? m.defaultTargetCircles ?? '',
          personalBonus: mw?.personalBonus ?? '',
        }
      }),
    },
  })

  function openEditor() {
    form.setValues({
      description: week.weekGoal?.description ?? '',
      familyBonus: week.weekGoal?.familyBonus ?? '',
      familyTargetCircles: week.weekGoal?.familyTargetCircles ?? '',
      members: members.map((m) => {
        const mw = week.memberWeek.find((x) => x.memberId === m.id)
        return {
          memberId: m.id,
          name: m.name,
          targetCircles: mw?.targetCircles ?? m.defaultTargetCircles ?? '',
          personalBonus: mw?.personalBonus ?? '',
        }
      }),
    })
    setEditing(true)
  }

  function submit(values: FormValues) {
    const payload: WeekPlanInput = {
      weekGoal: {
        description: values.description.trim() || null,
        familyBonus: values.familyBonus.trim() || null,
        familyTargetCircles:
          values.familyTargetCircles === '' ? null : Number(values.familyTargetCircles),
      },
      memberWeek: values.members.map((m) => ({
        memberId: m.memberId,
        targetCircles: m.targetCircles === '' ? null : Number(m.targetCircles),
        personalBonus: m.personalBonus.trim() || null,
      })),
    }
    savePlan.mutate(payload, { onSuccess: () => setEditing(false) })
  }

  return (
    <Card withBorder radius="lg" padding="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={3}>Ugens plan</Title>
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<IconPencil size={14} />}
            onClick={openEditor}
          >
            Rediger plan
          </Button>
        </Group>

        {!initialized && (
          <Alert variant="light" color="green" icon={<IconSparkles size={18} />}>
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Text size="sm">Denne uge har ingen plan endnu.</Text>
              <Group gap="xs">
                <Button
                  size="compact-sm"
                  variant="default"
                  leftSection={<IconCopy size={14} />}
                  loading={initWeek.isPending}
                  onClick={() => initWeek.mutate('copy')}
                >
                  Kopier sidste uge
                </Button>
                <Button
                  size="compact-sm"
                  variant="light"
                  leftSection={<IconSparkles size={14} />}
                  loading={initWeek.isPending}
                  onClick={() => initWeek.mutate('blank')}
                >
                  Start blank
                </Button>
              </Group>
            </Group>
          </Alert>
        )}

        {week.weekGoal?.description && <Text>🎯 {week.weekGoal.description}</Text>}

        {/* Personlige bonusser */}
        <Stack gap={6}>
          {members.map((m) => {
            const mw = week.memberWeek.find((x) => x.memberId === m.id)
            const ach = week.achievements.perMember[m.id]
            if (!mw?.personalBonus && mw?.targetCircles == null) return null
            return (
              <Group key={m.id} justify="space-between" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="gray">
                    <IconGift size={14} />
                  </ThemeIcon>
                  <Text size="sm">
                    <b>{m.name}</b>
                    {mw?.targetCircles != null ? ` · mål ${mw.targetCircles}` : ''}
                    {mw?.personalBonus ? ` · ${mw.personalBonus}` : ''}
                  </Text>
                </Group>
                {ach?.reached && (
                  <Badge color="green" variant="filled">
                    Opnået ✓
                  </Badge>
                )}
              </Group>
            )
          })}
        </Stack>

        {/* Fælles bonus */}
        {(week.weekGoal?.familyBonus || week.weekGoal?.familyTargetCircles != null) && (
          <>
            <Divider />
            <Group justify="space-between" wrap="nowrap">
              <Group gap={8} wrap="nowrap">
                <ThemeIcon size="sm" radius="xl" variant="light" color="yellow">
                  <IconTrophy size={14} />
                </ThemeIcon>
                <Text size="sm">
                  <b>Fælles bonus</b>
                  {week.weekGoal?.familyBonus ? ` · ${week.weekGoal.familyBonus}` : ''}{' '}
                  <Text span c="dimmed" size="xs">
                    (
                    {week.weekGoal?.familyTargetCircles != null
                      ? `når alle når ${week.weekGoal.familyTargetCircles} cirkler`
                      : 'når alle er i mål'}
                    )
                  </Text>
                </Text>
              </Group>
              {week.achievements.familyReached && (
                <Badge color="green" variant="filled">
                  Opnået ✓
                </Badge>
              )}
            </Group>
          </>
        )}
      </Stack>

      <Modal opened={editing} onClose={() => setEditing(false)} title="Rediger ugens plan" centered>
        <form onSubmit={form.onSubmit(submit)}>
          <Stack gap="sm">
            <TextInput
              label="Ugens mål"
              placeholder="fx Ud at bevæge os hver dag"
              {...form.getInputProps('description')}
            />
            <TextInput
              label="Fælles bonus"
              placeholder="fx Biograftur"
              {...form.getInputProps('familyBonus')}
            />
            <NumberInput
              label="Fælles mål — cirkler pr. person"
              description="Alle skal nå dette antal for at udløse den fælles bonus. Tom = når alle har nået deres personlige mål."
              placeholder="fx 5"
              min={0}
              max={7}
              {...form.getInputProps('familyTargetCircles')}
            />
            <Divider label="Pr. medlem" />
            {form.values.members.map((mm, i) => (
              <SimpleGrid key={mm.memberId} cols={{ base: 1, xs: 2 }} spacing="xs">
                <NumberInput
                  label={`${mm.name} · mål`}
                  placeholder="cirkler"
                  min={0}
                  max={7}
                  {...form.getInputProps(`members.${i}.targetCircles`)}
                />
                <TextInput
                  label="Personlig bonus"
                  placeholder="fx Is"
                  {...form.getInputProps(`members.${i}.personalBonus`)}
                />
              </SimpleGrid>
            ))}
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setEditing(false)}>
                Annuller
              </Button>
              <Button type="submit" loading={savePlan.isPending}>
                Gem plan
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Card>
  )
}
