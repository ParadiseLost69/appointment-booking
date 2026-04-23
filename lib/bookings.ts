import { neon } from '@neondatabase/serverless'

function sql() {
  return neon(process.env.POSTGRES_URL!)
}

export interface Booking {
  id: string
  name: string
  email: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM (24h)
  note?: string
  createdAt: string
}

export async function getBookedDates(): Promise<string[]> {
  const db = sql()
  const rows = await db`SELECT DISTINCT date FROM bookings ORDER BY date`
  return rows.map(r => r.date as string)
}

export async function getBookedTimesForDate(date: string): Promise<string[]> {
  const db = sql()
  const rows = await db`SELECT time FROM bookings WHERE date = ${date}`
  return rows.map(r => r.time as string)
}

export async function createBooking(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const db = sql()

  const existing = await db`SELECT id FROM bookings WHERE date = ${data.date} LIMIT 1`
  if (existing.length > 0) {
    throw new Error('This day is already booked. Please choose another day.')
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const createdAt = new Date().toISOString()

  await db`
    INSERT INTO bookings (id, name, email, date, time, note, created_at)
    VALUES (${id}, ${data.name}, ${data.email}, ${data.date}, ${data.time}, ${data.note ?? null}, ${createdAt})
  `

  return { id, ...data, createdAt }
}
