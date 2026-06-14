import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Container, Stack, Loader, Center, Text, Divider, Group, Title, Button, ActionIcon, Alert } from '@mantine/core'
import { IconUsers, IconPrinter, IconAlertTriangle } from '@tabler/icons-react'
import { currentWeekKey } from './lib/isoWeek'
import { useMembers, useWeek } from './api/client'
import { WeekNavigator } from './components/WeekNavigator'
import { WeekGrid } from './components/WeekGrid'
import { WeekPlanPanel } from './components/WeekPlanPanel'
import { MembersDrawer } from './components/MembersDrawer'
import { PrintView } from './routes/PrintView'

function WeekPage() {
  const [weekKey, setWeekKey] = useState(currentWeekKey())
  const [membersOpen, setMembersOpen] = useState(false)
  const navigate = useNavigate()
  const members = useMembers()
  const week = useWeek(weekKey)

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Title order={1} size="h2">
            Bevægelsesuge
          </Title>
          {/* Desktop: knapper med tekst */}
          <Group gap="xs" visibleFrom="sm" wrap="nowrap">
            <Button
              variant="default"
              leftSection={<IconUsers size={16} />}
              onClick={() => setMembersOpen(true)}
            >
              Medlemmer
            </Button>
            <Button
              variant="light"
              leftSection={<IconPrinter size={16} />}
              onClick={() => navigate(`/print/${weekKey}`)}
            >
              Print denne uge
            </Button>
          </Group>
          {/* Mobil: ikon-knapper */}
          <Group gap="xs" hiddenFrom="sm" wrap="nowrap">
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Medlemmer"
              onClick={() => setMembersOpen(true)}
            >
              <IconUsers size={18} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              size="lg"
              aria-label="Print denne uge"
              onClick={() => navigate(`/print/${weekKey}`)}
            >
              <IconPrinter size={18} />
            </ActionIcon>
          </Group>
        </Group>
        <MembersDrawer opened={membersOpen} onClose={() => setMembersOpen(false)} />
        <WeekNavigator weekKey={weekKey} onChange={setWeekKey} />
        <Divider />
        {members.isError || week.isError ? (
          <Alert
            color="red"
            icon={<IconAlertTriangle size={18} />}
            title="Kan ikke nå serveren"
          >
            <Stack gap="xs" align="flex-start">
              <Text size="sm">
                Appen kører, men kan ikke forbinde til serveren (API'et). Tjek at
                backend'en/containeren kører, og prøv igen.
              </Text>
              <Button
                size="compact-sm"
                variant="white"
                color="red"
                onClick={() => {
                  members.refetch()
                  week.refetch()
                }}
              >
                Prøv igen
              </Button>
            </Stack>
          </Alert>
        ) : members.isLoading || week.isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : members.data && members.data.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Ingen medlemmer endnu — tilføj familiemedlemmer for at komme i gang.
          </Text>
        ) : members.data && week.data ? (
          <>
            <WeekGrid weekKey={weekKey} members={members.data} week={week.data} />
            <WeekPlanPanel weekKey={weekKey} members={members.data} week={week.data} />
          </>
        ) : null}
      </Stack>
    </Container>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<WeekPage />} />
      <Route path="/print/:weekKey" element={<PrintView />} />
    </Routes>
  )
}
