import { createTheme } from '@mantine/core'

// Additivt, venligt look — grøn primær, runde hjørner, ingen "fare"-røde toner i kernen.
export const theme = createTheme({
  primaryColor: 'green',
  defaultRadius: 'lg',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontWeight: '700',
  },
})

// Foruddefinerede medlems-farver (Mantine-paletnavne) til hurtigt valg i UI'et.
export const MEMBER_COLORS = [
  '#e8590c', // orange
  '#2f9e44', // green
  '#1971c2', // blue
  '#9c36b5', // grape
  '#e64980', // pink
  '#f08c00', // yellow
  '#0c8599', // cyan
  '#5f3dc4', // violet
] as const
