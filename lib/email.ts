import type { Booking } from './bookings'

// ─── ICS ────────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function generateICS(booking: Booking): string {
  const [year, month, day] = booking.date.split('-').map(Number)
  const [hours, minutes] = booking.time.split(':').map(Number)

  const startDT = `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`
  const endTotalMin = hours * 60 + minutes + 60
  const endDT = `${year}${pad(month)}${pad(day)}T${pad(Math.floor(endTotalMin / 60))}${pad(endTotalMin % 60)}00`
  const nowDT = new Date().toISOString().replace(/[-:.Z]/g, '').slice(0, 15) + 'Z'
  const uid = `${Date.now()}@appointment-booking`
  const adminEmail = process.env.ADMIN_EMAIL || 'tloukas2@uwo.ca'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appointment Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowDT}`,
    `DTSTART:${startDT}`,
    `DTEND:${endDT}`,
    `SUMMARY:Web Review with ${booking.name}`,
    `DESCRIPTION:Name: ${booking.name}\\nEmail: ${booking.email}\\nRoom: 2N10`,
    `LOCATION:Room 2N10`,
    `ORGANIZER;CN=Calendar:mailto:${adminEmail}`,
    `ATTENDEE;CN=${booking.name};RSVP=TRUE:mailto:${booking.email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDisplayTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const ampm = hours < 12 ? 'AM' : 'PM'
  const h = hours % 12 || 12
  return `${h}:${pad(minutes)} ${ampm}`
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

const base = `font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 24px;color:#1a1a1a;background:#fff`
const lbl = `padding:12px 0;border-bottom:1px solid #ececec;width:110px;color:#888;font-family:monospace;font-size:12px;text-transform:uppercase;vertical-align:top`
const val = `padding:12px 0;border-bottom:1px solid #ececec;font-size:15px`

function adminHtml(booking: Booking, displayDate: string, displayTime: string): string {
  return `<div style="${base}">
    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin-bottom:24px">New Booking Request</p>
    <h2 style="font-weight:400;font-size:26px;margin:0 0 32px">${booking.name} has booked a Web Review</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="${lbl}">Name</td><td style="${val}">${booking.name}</td></tr>
      <tr><td style="${lbl}">Email</td><td style="${val}"><a href="mailto:${booking.email}" style="color:#1a1a1a">${booking.email}</a></td></tr>
      <tr><td style="${lbl}">Date</td><td style="${val}">${displayDate}</td></tr>
      <tr><td style="${lbl}">Time</td><td style="${val}">${displayTime}</td></tr>
      <tr><td style="${lbl}">Room</td><td style="${val}">2N10</td></tr>
      <tr><td style="${lbl}">Purpose</td><td style="${val}">Web Review</td></tr>
    </table>
    <p style="margin-top:28px;font-size:13px;color:#999">Open the attached .ics file to add this to your Outlook calendar.</p>
  </div>`
}

function confirmationHtml(booking: Booking, displayDate: string, displayTime: string): string {
  return `<div style="${base}">
    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin-bottom:24px">Booking Confirmed</p>
    <h2 style="font-weight:400;font-size:26px;margin:0 0 8px">See you ${displayDate}.</h2>
    <p style="color:#666;margin:0 0 32px;font-size:15px">Here are your booking details.</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="${lbl}">Date</td><td style="${val}">${displayDate}</td></tr>
      <tr><td style="${lbl}">Time</td><td style="${val}">${displayTime}</td></tr>
      <tr><td style="${lbl}">Room</td><td style="${val}">2N10</td></tr>
      <tr><td style="${lbl}">Purpose</td><td style="${val}">Web Review</td></tr>
      <tr><td style="${lbl}">Duration</td><td style="${val}">1 hour</td></tr>
    </table>
    <p style="margin-top:28px;font-size:14px;color:#555;line-height:1.7">A calendar invite is attached — open it to add this to your calendar. To reschedule or cancel, reply to this email.</p>
  </div>`
}

// ─── Mailjet HTTP API ────────────────────────────────────────────────────────

async function mailjetSend(
  to: string,
  subject: string,
  html: string,
  icsContent: string
): Promise<void> {
  const apiKey = process.env.MAILJET_API_KEY!
  const secretKey = process.env.MAILJET_SECRET_KEY!
  const fromEmail = process.env.MAILJET_FROM_EMAIL!

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64')

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: fromEmail, Name: 'Appointment Booking' },
        To: [{ Email: to }],
        Subject: subject,
        HTMLPart: html,
        Attachments: [{
          ContentType: 'text/calendar;method=REQUEST',
          Filename: 'appointment.ics',
          Base64Content: Buffer.from(icsContent).toString('base64'),
        }],
      }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mailjet HTTP ${res.status}: ${text}`)
  }

  const data = await res.json() as { Messages: { Status: string; Errors?: unknown[] }[] }
  if (data.Messages?.[0]?.Status !== 'success') {
    throw new Error(`Mailjet rejected: ${JSON.stringify(data.Messages?.[0]?.Errors)}`)
  }
}

// ─── Send ────────────────────────────────────────────────────────────────────

export async function sendBookingEmails(booking: Booking): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'tloukas2@uwo.ca'
  const displayDate = formatDisplayDate(booking.date)
  const displayTime = formatDisplayTime(booking.time)
  const ics = generateICS(booking)

  const [adminResult, userResult] = await Promise.allSettled([
    mailjetSend(
      adminEmail,
      `New Web Review — ${booking.name} · ${displayDate} at ${displayTime}`,
      adminHtml(booking, displayDate, displayTime),
      ics
    ),
    mailjetSend(
      booking.email,
      `Web Review confirmed — ${displayDate} at ${displayTime}`,
      confirmationHtml(booking, displayDate, displayTime),
      ics
    ),
  ])

  if (adminResult.status === 'rejected') console.error('Admin email failed:', adminResult.reason)
  else console.log('Admin email sent to', adminEmail)

  if (userResult.status === 'rejected') console.error('User confirmation failed:', userResult.reason)
  else console.log('Confirmation email sent to', booking.email)
}
