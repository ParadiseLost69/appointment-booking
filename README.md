# Appointment Booking

A self-hosted appointment scheduling app built with Next.js. Visitors pick a date and time, enter their name and email, and submit a booking request. You receive an email notification with a calendar invite; they receive a confirmation.

## Features

- **Tuesdays and Thursdays only** — other days are greyed out on the calendar
- **One booking per day** — once a day is taken it's struck through and unselectable
- **Time slots from 10 AM – 3:30 PM** in 30-minute increments
- **1-hour sessions** in Room 2N10
- **Email notifications** — admin gets a booking summary, visitor gets a confirmation; both include an `.ics` calendar attachment
- **Postgres persistence** via Neon — bookings survive deploys and server restarts

---

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier)
- A [Mailjet](https://mailjet.com) account (free tier, up to 200 emails/day)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/ParadiseLost69/appointment-booking.git
cd appointment-booking
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `POSTGRES_URL` | Neon dashboard → Connection Details → Connection string |
| `MAILJET_API_KEY` | Mailjet → Account → API Key Management |
| `MAILJET_SECRET_KEY` | Same page as above |
| `MAILJET_FROM_EMAIL` | The sender email you verified in Mailjet |
| `ADMIN_EMAIL` | Your email — booking notifications are sent here |

### 3. Create the database table

Run once after setting `POSTGRES_URL`:

```bash
node --env-file=.env.local scripts/setup-db.mjs
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. In **Settings → Environment Variables**, add all five variables from `.env.local.example` with your real values
4. Deploy — Vercel runs `npm run build` automatically

The database table only needs to be created once. If you haven't run `setup-db.mjs` locally against the same Neon database, run it now (it's safe to run again — uses `CREATE TABLE IF NOT EXISTS`).

---

## How It Works

```
Visitor submits form
        │
        ▼
POST /api/bookings
  - Validates name, email, date, time
  - Checks date is Tuesday or Thursday
  - Checks day isn't already booked (Postgres)
  - Saves booking to Postgres
  - Fires two emails via Mailjet (non-blocking):
      • Admin notification with booking details
      • Visitor confirmation
  - Both emails include an .ics calendar attachment
        │
        ▼
Calendar updates instantly — booked day is struck through
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/bookings` | POST | Create a booking |
| `/api/booked-dates` | GET | Return all dates with existing bookings |
| `/api/available` | GET | Return booked time slots for a specific date |

### Project Structure

```
app/
  page.tsx              # Booking UI (calendar + form)
  api/
    bookings/route.ts   # Create booking
    booked-dates/route.ts
    available/route.ts
lib/
  bookings.ts           # Database queries
  email.ts              # ICS generation + Mailjet sending
scripts/
  setup-db.mjs          # One-time table creation
```
