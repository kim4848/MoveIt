import { Group, ActionIcon, Stack, Title, Text, Button } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { addWeeks, currentWeekKey, weekNumber, weekRangeLabel } from '../lib/isoWeek'

export interface WeekNavigatorProps {
  weekKey: string
  onChange: (weekKey: string) => void
}

export function WeekNavigator({ weekKey, onChange }: WeekNavigatorProps) {
  const isThisWeek = weekKey === currentWeekKey()
  return (
    <Group justify="space-between" wrap="nowrap">
      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Forrige uge"
        onClick={() => onChange(addWeeks(weekKey, -1))}
      >
        <IconChevronLeft />
      </ActionIcon>

      <Stack gap={0} align="center">
        <Title order={2}>Uge {weekNumber(weekKey)}</Title>
        <Text size="sm" c="dimmed">
          {weekRangeLabel(weekKey)}
        </Text>
        {!isThisWeek && (
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => onChange(currentWeekKey())}
          >
            Gå til denne uge
          </Button>
        )}
      </Stack>

      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Næste uge"
        onClick={() => onChange(addWeeks(weekKey, 1))}
      >
        <IconChevronRight />
      </ActionIcon>
    </Group>
  )
}
