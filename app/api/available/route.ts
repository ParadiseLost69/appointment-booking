import { NextRequest, NextResponse } from 'next/server'
import { getBookedTimesForDate } from '@/lib/bookings'

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Valid date parameter required (YYYY-MM-DD)' }, { status: 400 })
  }

  const booked = await getBookedTimesForDate(date)
  return NextResponse.json({ booked })
}
