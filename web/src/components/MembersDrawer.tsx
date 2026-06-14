import { useState } from 'react'
import {
  Drawer,
  Stack,
  Group,
  Text,
  Button,
  ActionIcon,
  TextInput,
  NumberInput,
  ColorInput,
  Card,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react'
import type { Member } from '../api/types'
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
} from '../api/client'
import { MEMBER_COLORS } from '../theme'

interface FormValues {
  name: string
  dailyTargetMinutes: number | string
  color: string
  defaultTargetCircles: number | string
}

const emptyForm: FormValues = {
  name: '',
  dailyTargetMinutes: 15,
  color: MEMBER_COLORS[1],
  defaultTargetCircles: '',
}

export function MembersDrawer({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const members = useMembers()
  const create = useCreateMember()
  const update = useUpdateMember()
  const remove = useDeleteMember()
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  const form = useForm<FormValues>({
    initialValues: emptyForm,
    validate: { name: (v) => (v.trim() ? null : 'Navn er påkrævet') },
  })

  function startAdd() {
    form.setValues({ ...emptyForm, color: MEMBER_COLORS[(members.data?.length ?? 0) % MEMBER_COLORS.length] })
    setEditingId('new')
  }

  function startEdit(m: Member) {
    form.setValues({
      name: m.name,
      dailyTargetMinutes: m.dailyTargetMinutes,
      color: m.color,
      defaultTargetCircles: m.defaultTargetCircles ?? '',
    })
    setEditingId(m.id)
  }

  function submit(values: FormValues) {
    const payload = {
      name: values.name.trim(),
      dailyTargetMinutes: Number(values.dailyTargetMinutes) || 0,
      color: values.color,
      defaultTargetCircles:
        values.defaultTargetCircles === '' ? null : Number(values.defaultTargetCircles),
    }
    if (editingId === 'new') {
      create.mutate(payload, { onSuccess: () => setEditingId(null) })
    } else if (editingId) {
      update.mutate({ id: editingId, ...payload }, { onSuccess: () => setEditingId(null) })
    }
  }

  function move(index: number, dir: -1 | 1) {
    const list = members.data
    if (!list) return
    const a = list[index]
    const b = list[index + dir]
    if (!a || !b) return
    update.mutate({ id: a.id, order: b.order })
    update.mutate({ id: b.id, order: a.order })
  }

  const list = members.data ?? []

  return (
    <Drawer opened={opened} onClose={onClose} title="Medlemmer" position="right" size="md">
      <Stack gap="sm">
        {list.map((m, i) => (
          <Card key={m.id} withBorder padding="xs" radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Group gap={8} wrap="nowrap">
                <span
                  style={{ width: 14, height: 14, borderRadius: '50%', background: m.color, flex: 'none' }}
                />
                <div>
                  <Text fw={600}>{m.name}</Text>
                  <Text size="xs" c="dimmed">
                    {m.dailyTargetMinutes} min/dag
                    {m.defaultTargetCircles != null ? ` · ${m.defaultTargetCircles} cirkler/uge` : ''}
                  </Text>
                </div>
              </Group>
              <Group gap={2} wrap="nowrap">
                <ActionIcon variant="subtle" disabled={i === 0} aria-label="Flyt op" onClick={() => move(i, -1)}>
                  <IconChevronUp size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  disabled={i === list.length - 1}
                  aria-label="Flyt ned"
                  onClick={() => move(i, 1)}
                >
                  <IconChevronDown size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" aria-label={`Rediger ${m.name}`} onClick={() => startEdit(m)}>
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Slet ${m.name}`}
                  onClick={() => remove.mutate(m.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}

        {editingId === null ? (
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={startAdd}>
            Tilføj medlem
          </Button>
        ) : (
          <>
            <Divider label={editingId === 'new' ? 'Nyt medlem' : 'Rediger medlem'} />
            <form onSubmit={form.onSubmit(submit)}>
              <Stack gap="xs">
                <TextInput label="Navn" {...form.getInputProps('name')} data-autofocus />
                <NumberInput
                  label="Dagligt mål (minutter)"
                  description="Tæller som regeltekst — appen tager ikke tid"
                  min={0}
                  {...form.getInputProps('dailyTargetMinutes')}
                />
                <ColorInput
                  label="Farve"
                  withEyeDropper={false}
                  swatches={[...MEMBER_COLORS]}
                  {...form.getInputProps('color')}
                />
                <NumberInput
                  label="Standard ugemål (cirkler)"
                  description="Forudfyldes ved 'start blank'"
                  min={0}
                  max={7}
                  {...form.getInputProps('defaultTargetCircles')}
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setEditingId(null)}>
                    Annuller
                  </Button>
                  <Button type="submit" loading={create.isPending || update.isPending}>
                    Gem
                  </Button>
                </Group>
              </Stack>
            </form>
          </>
        )}

      </Stack>
    </Drawer>
  )
}
