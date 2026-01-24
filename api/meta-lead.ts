import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

const PIXEL_ID = '1430740015202870'
const META_API_VERSION = 'v18.0'

interface LeadEventData {
  fbp?: string
  fbc?: string
  url: string
  userAgent: string
  ip?: string
}

function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.META_CAPI_TOKEN

  if (!accessToken) {
    console.error('META_CAPI_TOKEN not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { fbp, fbc, url, userAgent } = req.body as LeadEventData

    // Get client IP from Vercel headers
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] as string ||
                     req.socket?.remoteAddress ||
                     ''

    const eventTime = Math.floor(Date.now() / 1000)
    const eventId = `lead_${eventTime}_${crypto.randomBytes(8).toString('hex')}`

    // Build user data object
    const userData: Record<string, string> = {}

    if (clientIp) {
      userData.client_ip_address = clientIp
    }

    if (userAgent) {
      userData.client_user_agent = userAgent
    }

    if (fbp) {
      userData.fbp = fbp
    }

    if (fbc) {
      userData.fbc = fbc
    }

    // Country code for Brazil (hashed)
    userData.country = hashData('br')

    const eventData = {
      event_name: 'Lead',
      event_time: eventTime,
      event_id: eventId,
      event_source_url: url,
      action_source: 'website',
      user_data: userData
    }

    const payload = {
      data: [eventData]
    }

    const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${PIXEL_ID}/events?access_token=${accessToken}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Meta CAPI Error:', result)
      return res.status(response.status).json({ error: 'Meta API error', details: result })
    }

    return res.status(200).json({
      success: true,
      event_id: eventId,
      events_received: result.events_received
    })

  } catch (error) {
    console.error('CAPI Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
