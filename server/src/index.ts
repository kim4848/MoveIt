import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createApp } from './app'
import { createDb } from './db'

const dbPath = process.env.DB_PATH ?? './data/movemore.db'
const db = createDb(dbPath)
const app = createApp(db)

// I produktion server'er vi den byggede frontend fra web/dist.
const staticRoot = process.env.STATIC_ROOT ?? 'web/dist'
app.use('/*', serveStatic({ root: staticRoot }))

// SPA-fallback: alle ikke-/api, ikke-fil ruter → index.html (client-side routing).
app.get('*', (c) => {
  try {
    const html = readFileSync(join(staticRoot, 'index.html'), 'utf-8')
    return c.html(html)
  } catch {
    return c.text('Not found', 404)
  }
})

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port })
console.log(`MoveIT server listening on http://localhost:${port} (db: ${dbPath})`)
