/**
 * One-time setup: creates the bookings table in your Neon Postgres database.
 *
 * Run once after adding POSTGRES_URL to .env.local:
 *   node --env-file=.env.local scripts/setup-db.mjs
 */

import { neon } from '@neondatabase/serverless'

const url = process.env.POSTGRES_URL
if (!url) {
  console.error('\nError: POSTGRES_URL is not set in .env.local')
  console.error('Add your Neon connection string first.\n')
  process.exit(1)
}

const sql = neon(url)

await sql`
  CREATE TABLE IF NOT EXISTS bookings (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    date        TEXT NOT NULL UNIQUE,
    time        TEXT NOT NULL,
    note        TEXT,
    created_at  TEXT NOT NULL
  )
`

console.log('✓ Bookings table ready')
process.exit(0)
