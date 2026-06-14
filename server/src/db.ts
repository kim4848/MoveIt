import Database from 'better-sqlite3'

export type DB = Database.Database

const SCHEMA = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  daily_target_minutes INTEGER NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  default_target_circles INTEGER
);

CREATE TABLE IF NOT EXISTS week_goals (
  week_key TEXT PRIMARY KEY,
  description TEXT,
  family_bonus TEXT,
  family_target_circles INTEGER
);

CREATE TABLE IF NOT EXISTS member_week (
  week_key TEXT NOT NULL,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  target_circles INTEGER,
  personal_bonus TEXT,
  PRIMARY KEY (week_key, member_id)
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL,
  activity TEXT,
  together INTEGER NOT NULL,
  UNIQUE(member_id, date)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`

export function createDb(path: string): DB {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  migrate(db)
  return db
}

// Letvægts-migrationer for databaser oprettet før en kolonne fandtes.
function migrate(db: DB): void {
  const cols = db.prepare('PRAGMA table_info(week_goals)').all() as { name: string }[]
  if (!cols.some((c) => c.name === 'family_target_circles')) {
    db.exec('ALTER TABLE week_goals ADD COLUMN family_target_circles INTEGER')
  }
}
