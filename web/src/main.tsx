import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

import { theme } from './theme'
import { App } from './App'

// Delt server-state: hold data frisk på tværs af enheder uden at hamre serveren.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchInterval: 20_000,
      staleTime: 5_000,
      retry: 1,
    },
  },
  // Gør skrivefejl synlige i stedet for en tavs tilbagerulning af den optimistiske ændring.
  mutationCache: new MutationCache({
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Kunne ikke gemme',
        message: 'Serveren svarede ikke. Tjek at appen kører, og prøv igen.',
      })
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
