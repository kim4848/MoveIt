import { useState } from 'react'
import { Group, Text, Pill, Button, TextInput } from '@mantine/core'
import { IconRun, IconPlus } from '@tabler/icons-react'
import { useActivities, useSaveActivities } from '../api/client'

// Familie-fælles "positiv liste" — redigerbar direkte på forsiden, vises også på print.
export function ActivityIdeas() {
  const activities = useActivities()
  const { save } = useSaveActivities()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v && !activities.includes(v)) save([...activities, v])
    setDraft('')
    setAdding(false)
  }

  function remove(name: string) {
    save(activities.filter((a) => a !== name))
  }

  return (
    <Group gap={6} mt="sm" align="center">
      <Group gap={4} wrap="nowrap">
        <IconRun size={15} color="var(--mantine-color-green-6)" />
        <Text size="xs" fw={600} c="dimmed">
          Idéer der tæller:
        </Text>
      </Group>

      {activities.map((a) => (
        <Pill key={a} withRemoveButton onRemove={() => remove(a)} size="sm">
          {a}
        </Pill>
      ))}

      {adding ? (
        <TextInput
          size="xs"
          placeholder="fx fodbold"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
            if (e.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
          w={130}
        />
      ) : (
        <Button
          size="compact-xs"
          variant="subtle"
          color="green"
          leftSection={<IconPlus size={13} />}
          onClick={() => setAdding(true)}
        >
          Tilføj idé
        </Button>
      )}
    </Group>
  )
}
