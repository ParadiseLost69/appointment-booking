import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '@/lib/bookings'
import { sendBookingEmails } from '@/lib/email'

const VALID_TIMES = new Set([
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
])

export async function POST(request: NextRequest) {
  try {
    const { name, email, date, time, note } = await request.json()

    if (!name?.trim() || !email?.trim() || !date || !time) {
      return NextResponse.json({ error: 'Name, email, date, and time are required.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Server-side validation: only Tuesdays and Thursdays
    const [year, month, day] = date.split('-').map(Number)
    const dow = new Date(year, month - 1, day).getDay()
    if (dow !== 2 && dow !== 4) {
      return NextResponse.json({ error: 'Appointments are only available on Tuesdays and Thursdays.' }, { status: 400 })
    }

    if (!VALID_TIMES.has(time)) {
      return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 })
    }

    const booking = await createBooking({ name: name.trim(), email: email.trim(), date, time, note: note?.trim() || undefined })

    if (process.env.MAILJET_API_KEY) {
      sendBookingEmails(booking).catch(err => {
        console.error('Email send failed:', err)
      })
    }

    return NextResponse.json({ success: true, id: booking.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
