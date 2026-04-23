/**
 * One-time setup: authenticates with your personal Microsoft account
 * and saves a refresh token to .env.local so the app can send email.
 *
 * Run once: node scripts/setup-email.mjs
 * Re-run if you see "token expired" errors (every ~90 days of inactivity).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

// ─── Read .env.local ─────────────────────────────────────────────────────────

function readEnv() {
  if (!existsSync('.env.local')) return {}
  return Object.fromEntries(
    readFileSync('.env.local', 'utf-8')
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  )
}

function updateEnv(key, value) {
  const path = '.env.local'
  let content = existsSync(path) ? readFileSync(path, 'utf-8') : ''
  const line = `${key}=${value}`
  if (new RegExp(`^${key}=`, 'm').test(content)) {
    content = content.replace(new RegExp(`^${key}=.*$`, 'm'), line)
  } else {
    content = content.trimEnd() + '\n' + line + '\n'
  }
  writeFileSync(path, content)
}

// ─── Device code flow ─────────────────────────────────────────────────────────

const env = readEnv()
const CLIENT_ID = env.MICROSOFT_CLIENT_ID

if (!CLIENT_ID) {
  console.error('\nError: MICROSOFT_CLIENT_ID is not set in .env.local')
  console.error('Follow the setup instructions to register an Azure app first.\n')
  process.exit(1)
}

const TENANT = 'consumers'
const SCOPE = 'Mail.Send offline_access'

console.log('\nRequesting device code...')

const deviceRes = await fetch(
  `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/devicecode`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE }),
  }
)

const device = await deviceRes.json()
if (!deviceRes.ok) {
  console.error('Failed to get device code:', device.error_description)
  process.exit(1)
}

console.log('\n─────────────────────────────────────────')
console.log(`  1. Open:  ${device.verification_uri}`)
console.log(`  2. Enter: ${device.user_code}`)
console.log('─────────────────────────────────────────')
console.log('\nSign in with your @outlook.com account, then come back here.\n')

// ─── Poll for token ───────────────────────────────────────────────────────────

const pollMs = (device.interval ?? 5) * 1000
let token = null

while (!token) {
  await new Promise(r => setTimeout(r, pollMs))

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: CLIENT_ID,
        device_code: device.device_code,
      }),
    }
  )

  const data = await tokenRes.json()

  if (data.error === 'authorization_pending') {
    process.stdout.write('.')
    continue
  }
  if (data.error === 'expired_token') {
    console.error('\nThe code expired. Run the script again.')
    process.exit(1)
  }
  if (data.error) {
    console.error('\nError:', data.error_description)
    process.exit(1)
  }

  token = data
}

// ─── Save tokens ──────────────────────────────────────────────────────────────

updateEnv('MICROSOFT_REFRESH_TOKEN', token.refresh_token)
updateEnv('MICROSOFT_FROM_EMAIL', token.id_token
  ? JSON.parse(Buffer.from(token.id_token.split('.')[1], 'base64').toString()).email ?? ''
  : ''
)

console.log('\n\n✓ Signed in successfully!')
console.log('✓ Refresh token saved to .env.local')
console.log('\nRestart your dev server: Ctrl+C → npm run dev\n')
