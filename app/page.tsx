'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Constants ──────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { time: '10:00', label: '10:00 AM' },
  { time: '10:30', label: '10:30 AM' },
  { time: '11:00', label: '11:00 AM' },
  { time: '11:30', label: '11:30 AM' },
  { time: '12:00', label: '12:00 PM' },
  { time: '12:30', label: '12:30 PM' },
  { time: '13:00', label: '1:00 PM' },
  { time: '13:30', label: '1:30 PM' },
  { time: '14:00', label: '2:00 PM' },
  { time: '14:30', label: '2:30 PM' },
  { time: '15:00', label: '3:00 PM' },
  { time: '15:30', label: '3:30 PM' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function isAvailable(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay()
  return dow === 2 || dow === 4 // Tuesday or Thursday
}

function isPast(year: number, month: number, day: number): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(year, month, day) < today
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date()
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function generateICS(name: string, date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  const startDT = `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(mi)}00`
  const end = h * 60 + mi + 60
  const endDT = `${y}${pad(mo)}${pad(d)}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appointment Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDT}`,
    `DTEND:${endDT}`,
    `SUMMARY:Web Review`,
    `LOCATION:Room 2N10`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadICS(name: string, date: string, time: string) {
  const blob = new Blob([generateICS(name, date, time)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'appointment.ics'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-300 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-25'}`}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono transition-all duration-300
        ${active ? 'border-gold text-gold' : done ? 'border-muted bg-muted/20 text-muted' : 'border-muted/30 text-muted/30'}`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-xs font-mono uppercase tracking-widest ${active ? 'text-ivory' : 'text-muted'}`}>{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border my-0" />
}

// ─── Calendar ────────────────────────────────────────────────────────────────

interface CalendarProps {
  year: number
  month: number
  selectedDate: string | null
  bookedDates: string[]
  onSelect: (dateStr: string) => void
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
}

function Calendar({ year, month, selectedDate, bookedDates, onSelect, onPrev, onNext, canGoPrev }: CalendarProps) {
  const cells = getMonthGrid(year, month)

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="w-7 h-7 flex items-center justify-center text-muted hover:text-ivory disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span className="font-cormorant text-xl font-light text-ivory tracking-wide">
          {MONTHS[month]} <span className="text-muted">{year}</span>
        </span>

        <button
          onClick={onNext}
          className="w-7 h-7 flex items-center justify-center text-muted hover:text-ivory transition-colors"
          aria-label="Next month"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-mono uppercase tracking-widest py-1.5
              ${i === 2 || i === 4 ? 'text-gold/60' : 'text-muted/40'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />

          const available = isAvailable(year, month, day)
          const past = isPast(year, month, day)
          const today = isToday(year, month, day)
          const dateStr = toDateStr(year, month, day)
          const selected = dateStr === selectedDate
          const fullyBooked = bookedDates.includes(dateStr)
          const clickable = available && !past && !fullyBooked

          return (
            <button
              key={`d-${day}`}
              onClick={() => clickable && onSelect(dateStr)}
              disabled={!clickable}
              className={`
                relative aspect-square flex items-center justify-center text-sm font-mono
                rounded transition-all duration-150 outline-none
                ${selected
                  ? 'bg-gold text-ink font-medium'
                  : clickable
                  ? 'text-ivory hover:bg-surface-2 hover:text-gold cursor-pointer focus-visible:ring-1 focus-visible:ring-gold/50'
                  : fullyBooked
                  ? 'text-muted/20 line-through cursor-not-allowed'
                  : past
                  ? 'text-muted/20 cursor-not-allowed'
                  : 'text-muted/15 cursor-not-allowed'}
              `}
              aria-label={clickable ? `Select ${formatDateDisplay(dateStr)}` : undefined}
            >
              {day}
              {today && !selected && (
                <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-gold/70" />
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-[11px] font-mono text-muted/50 text-center tracking-wide">
        TUES &amp; THURS ONLY
      </p>
    </div>
  )
}

// ─── Time Slots ───────────────────────────────────────────────────────────────

interface TimeSlotsProps {
  selectedDate: string
  selectedTime: string | null
  bookedTimes: string[]
  loading: boolean
  onSelect: (time: string) => void
  onBack: () => void
}

function TimeSlots({ selectedDate, selectedTime, bookedTimes, loading, onSelect, onBack }: TimeSlotsProps) {
  return (
    <div className="anim-slide-right d0 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="text-muted hover:text-ivory transition-colors flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 1.5L3 6L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      <p className="font-cormorant text-2xl font-light text-ivory mb-1 mt-3">
        Choose a time
      </p>
      <p className="text-xs font-mono text-muted/70 mb-5 tracking-wide">
        {formatDateDisplay(selectedDate)} · 1-hour sessions
      </p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map(({ time, label }, i) => {
            const booked = bookedTimes.includes(time)
            const selected = time === selectedTime
            return (
              <button
                key={time}
                onClick={() => !booked && onSelect(time)}
                disabled={booked}
                className={`
                  anim-fade-up d${i} px-2 py-2.5 rounded border text-xs font-mono tracking-wide
                  transition-all duration-150 outline-none
                  ${selected
                    ? 'border-gold bg-gold/10 text-gold'
                    : booked
                    ? 'border-border/40 text-muted/20 line-through cursor-not-allowed'
                    : 'border-border text-ivory/70 hover:border-gold/50 hover:text-ivory cursor-pointer focus-visible:border-gold/50'}
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

interface BookingFormProps {
  selectedDate: string
  selectedTime: string
  onBack: () => void
  onSuccess: (name: string, email: string) => void
}

function BookingForm({ selectedDate, selectedTime, onBack, onSuccess }: BookingFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeLabel = TIME_SLOTS.find(s => s.time === selectedTime)?.label ?? selectedTime

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date: selectedDate, time: selectedTime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed.')
      onSuccess(name, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = `
    w-full bg-transparent border-0 border-b border-border text-ivory text-sm font-sans
    py-2.5 px-0 placeholder:text-muted/50 focus:outline-none focus:border-gold
    transition-colors duration-200
  `

  return (
    <div className="anim-slide-right d0 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="text-muted hover:text-ivory transition-colors flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 1.5L3 6L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      <p className="font-cormorant text-2xl font-light text-ivory mb-1 mt-3">
        Your details
      </p>
      <p className="text-xs font-mono text-muted/70 mb-1 tracking-wide">
        {formatDateDisplay(selectedDate)} · {timeLabel}
      </p>
      <p className="text-xs font-mono text-gold/60 mb-5 tracking-wide">
        Web Review · Room 2N10
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
            Full Name <span className="text-gold">*</span>
          </label>
          <input
            className={inputClass}
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
            Email Address <span className="text-gold">*</span>
          </label>
          <input
            className={inputClass}
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-400/80 font-mono bg-red-500/5 border border-red-500/10 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !email.trim()}
          className={`
            mt-auto self-start flex items-center gap-3 px-6 py-2.5 text-xs font-mono
            uppercase tracking-[0.15em] rounded transition-all duration-200 outline-none
            ${submitting || !name.trim() || !email.trim()
              ? 'bg-surface-2 text-muted cursor-not-allowed border border-border'
              : 'bg-gold text-ink hover:bg-gold-light cursor-pointer focus-visible:ring-2 focus-visible:ring-gold/50'}
          `}
        >
          {submitting ? (
            <>
              <span className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin" />
              Booking…
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </form>
    </div>
  )
}

// ─── Success View ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  name: string
  email: string
  date: string
  time: string
  onReset: () => void
}

function SuccessView({ name, email, date, time, onReset }: SuccessViewProps) {
  const timeLabel = TIME_SLOTS.find(s => s.time === time)?.label ?? time

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="anim-scale-up d0 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold/30 mb-8">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11L9 16L18 6" stroke="#c9a55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="font-cormorant text-4xl font-light text-ivory mb-3">
          You&rsquo;re all set.
        </h2>
        <p className="text-muted text-sm font-sans mb-8 leading-relaxed">
          Your appointment has been confirmed. A confirmation email is on its way to{' '}
          <span className="text-ivory/80">{email}</span>.
        </p>

        <div className="border border-border rounded-lg p-5 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Name</span>
            <span className="text-sm text-ivory font-sans">{name}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Date</span>
            <span className="text-sm text-ivory font-sans">{formatDateDisplay(date)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Time</span>
            <span className="text-sm text-ivory font-mono">{timeLabel}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Room</span>
            <span className="text-sm text-ivory font-mono">2N10</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Purpose</span>
            <span className="text-sm text-ivory font-mono">Web Review</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => downloadICS(name, date, time)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-ivory/70 hover:text-ivory hover:border-gold/40 text-xs font-mono uppercase tracking-widest rounded transition-all duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v7M3.5 5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add to Calendar
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-2 text-ivory/60 hover:text-ivory text-xs font-mono uppercase tracking-widest rounded transition-all duration-150 border border-border"
          >
            Book Another
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Idle Placeholder ─────────────────────────────────────────────────────────

function IdlePlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-5 opacity-40">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="font-cormorant text-xl font-light text-ivory/50 mb-2">
        Select a date
      </p>
      <p className="text-[11px] font-mono text-muted/40 tracking-wide">
        Tuesdays and Thursdays only
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [successName, setSuccessName] = useState('')
  const [successEmail, setSuccessEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/booked-dates')
      .then(r => r.json())
      .then(data => setBookedDates(data.bookedDates || []))
      .catch(err => console.error('Failed to load booked dates:', err))
  }, [])

  const canGoPrev =
    calYear > today.getFullYear() ||
    (calYear === today.getFullYear() && calMonth > today.getMonth())

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const handleDateSelect = useCallback((dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedTime(null)
    setBookedTimes([])
    setLoadingSlots(true)
    fetch(`/api/available?date=${dateStr}`)
      .then(r => r.json())
      .then(data => setBookedTimes(data.booked || []))
      .catch(() => setBookedTimes([]))
      .finally(() => setLoadingSlots(false))
  }, [])

  const handleTimeSelect = (time: string) => setSelectedTime(time)

  const handleBack = () => {
    if (selectedTime) setSelectedTime(null)
    else { setSelectedDate(null); setBookedTimes([]) }
  }

  const handleSuccess = (name: string, email: string) => {
    if (selectedDate) setBookedDates(prev => [...prev, selectedDate])
    setSuccessName(name)
    setSuccessEmail(email)
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelectedDate(null)
    setSelectedTime(null)
    setBookedTimes([])
    setSubmitted(false)
    setSuccessName('')
    setSuccessEmail('')
  }

  const phase: 'idle' | 'time' | 'form' =
    !selectedDate ? 'idle' : !selectedTime ? 'time' : 'form'

  if (submitted) {
    return (
      <SuccessView
        name={successName}
        email={successEmail}
        date={selectedDate!}
        time={selectedTime!}
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Header */}
      <header className="px-6 md:px-12 pt-10 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="anim-fade-up d0 flex items-center gap-3 mb-6">
            <StepBadge n={1} label="Date" active={phase === 'idle'} done={phase !== 'idle'} />
            <div className="w-6 h-px bg-border" />
            <StepBadge n={2} label="Time" active={phase === 'time'} done={phase === 'form'} />
            <div className="w-6 h-px bg-border" />
            <StepBadge n={3} label="Details" active={phase === 'form'} done={false} />
          </div>

          <p className="anim-fade-up d1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-2">
            Tuesdays &amp; Thursdays &nbsp;·&nbsp; 10 AM – 4 PM &nbsp;·&nbsp; 1 hour
          </p>
          <h1 className="anim-fade-up d2 font-cormorant text-5xl md:text-6xl font-light text-ivory leading-tight">
            Book an Appointment
          </h1>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 px-6 md:px-12 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="anim-fade-up d3 bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">

              {/* Calendar panel */}
              <div className="md:w-[320px] flex-shrink-0 p-7 border-b md:border-b-0 md:border-r border-border">
                <Calendar
                  year={calYear}
                  month={calMonth}
                  selectedDate={selectedDate}
                  bookedDates={bookedDates}
                  onSelect={handleDateSelect}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                  canGoPrev={canGoPrev}
                />
              </div>

              {/* Right panel */}
              <div className="flex-1 p-7 min-h-[340px]" key={phase + selectedDate}>
                {phase === 'idle' && <IdlePlaceholder />}
                {phase === 'time' && selectedDate && (
                  <TimeSlots
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    bookedTimes={bookedTimes}
                    loading={loadingSlots}
                    onSelect={handleTimeSelect}
                    onBack={handleBack}
                  />
                )}
                {phase === 'form' && selectedDate && selectedTime && (
                  <BookingForm
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onBack={handleBack}
                    onSuccess={handleSuccess}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 pb-8 mt-auto">
        <div className="max-w-4xl mx-auto border-t border-border/50 pt-6 flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted/40 tracking-widest uppercase">
            Appointment Scheduling
          </p>
          <p className="text-[10px] font-mono text-muted/40 tracking-wide">
            tloukas2@uwo.ca
          </p>
        </div>
      </footer>
    </div>
  )
}
