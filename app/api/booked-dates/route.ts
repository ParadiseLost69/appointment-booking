import { NextResponse } from 'next/server'
import { getBookedDates } from '@/lib/bookings'

export async function GET() {
  return NextResponse.json({ bookedDates: await getBookedDates() })
}
