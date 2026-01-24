declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Get the _fbp cookie value (Facebook Browser ID)
 */
export function getFbp(): string | undefined {
  const match = document.cookie.match(/_fbp=([^;]+)/)
  return match ? match[1] : undefined
}

/**
 * Get the _fbc cookie value (Facebook Click ID - from fbclid parameter)
 */
export function getFbc(): string | undefined {
  const match = document.cookie.match(/_fbc=([^;]+)/)
  return match ? match[1] : undefined
}

/**
 * Track Lead event via Meta Pixel (frontend) and Conversions API (backend)
 * Call this before redirecting to WhatsApp
 */
export async function trackLeadEvent(): Promise<void> {
  // 1. Fire Pixel event (frontend)
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead')
  }

  // 2. Send to Conversions API (backend)
  try {
    const payload = {
      fbp: getFbp(),
      fbc: getFbc(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Fire and forget - don't block the WhatsApp redirect
    fetch('/api/meta-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.error('CAPI tracking error:', err)
    })
  } catch (error) {
    console.error('Lead tracking error:', error)
  }
}
