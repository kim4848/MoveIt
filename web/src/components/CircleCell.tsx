import { useState } from 'react'
import { ActionIcon, Popover, Stack, Switch, Autocomplete, Button, Group, Box } from '@mantine/core'
import { IconCheck, IconStar, IconStarFilled, IconDots } from '@tabler/icons-react'
import classes from './CircleCell.module.css'

export interface CircleCellProps {
  memberName: string
  dayLabel: string
  color: string
  completed: boolean
  together: boolean
  activity: string | null
  suggestions: string[]
  onToggle: () => void
  onSetMeta: (next: { activity: string | null; together: boolean }) => void
}

export function CircleCell({
  memberName,
  dayLabel,
  color,
  completed,
  together,
  activity,
  suggestions,
  onToggle,
  onSetMeta,
}: CircleCellProps) {
  const [opened, setOpened] = useState(false)
  const [draftActivity, setDraftActivity] = useState(activity ?? '')
  const [draftTogether, setDraftTogether] = useState(together)

  function openEditor() {
    setDraftActivity(activity ?? '')
    setDraftTogether(together)
    setOpened(true)
  }

  function save() {
    onSetMeta({ activity: draftActivity.trim() || null, together: draftTogether })
    setOpened(false)
  }

  return (
    <div className={classes.cell}>
      <Box style={{ position: 'relative' }}>
        <button
          type="button"
          className={`${classes.circle} ${completed ? classes.filled : ''}`}
          style={{ '--cell-color': color } as React.CSSProperties}
          aria-pressed={completed}
          aria-label={`${memberName}, ${dayLabel}: ${completed ? 'fuldført' : 'ikke fuldført'}`}
          onClick={onToggle}
        >
          {completed && <IconCheck size={24} stroke={3} />}
        </button>
        {together && <IconStarFilled size={14} className={classes.star} />}
      </Box>

      {activity && <span className={classes.activity}>{activity}</span>}

      <Popover opened={opened} onChange={setOpened} position="bottom" withArrow shadow="md" trapFocus>
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            className={classes.dots}
            aria-label={`Rediger ${memberName}, ${dayLabel}`}
            onClick={openEditor}
          >
            <IconDots size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs" w={250}>
            {suggestions.length > 0 && (
              <Group gap={4}>
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    size="compact-xs"
                    radius="xl"
                    variant={draftActivity === s ? 'filled' : 'light'}
                    color="green"
                    onClick={() => setDraftActivity(s)}
                  >
                    {s}
                  </Button>
                ))}
              </Group>
            )}
            <Autocomplete
              label="Hvad?"
              placeholder="vælg eller skriv selv"
              data={suggestions}
              value={draftActivity}
              onChange={setDraftActivity}
              data-autofocus
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <Switch
              label="Sammen (stjerne)"
              checked={draftTogether}
              thumbIcon={draftTogether ? <IconStar size={12} /> : undefined}
              onChange={(e) => setDraftTogether(e.currentTarget.checked)}
            />
            <Button
              variant="light"
              color="green"
              leftSection={<IconCheck size={16} />}
              onClick={save}
              fullWidth
            >
              Gem
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  )
}
