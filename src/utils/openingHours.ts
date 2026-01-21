// Opening hours configuration
export const BUSINESS_HOURS = {
  0: null, // Sunday - Closed
  1: { open: 9, close: 19 }, // Monday
  2: { open: 9, close: 19 }, // Tuesday
  3: { open: 9, close: 19 }, // Wednesday
  4: { open: 9, close: 19 }, // Thursday
  5: { open: 9, close: 19 }, // Friday
  6: { open: 9, close: 16 }, // Saturday
} as const

export type OpenStatus = {
  isOpen: boolean
  currentDay: string
  message: string
  nextOpenTime?: string
}

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

/**
 * Get the current opening status of the business
 */
export function getOpeningStatus(): OpenStatus {
  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour + currentMinute / 60

  const todayHours = BUSINESS_HOURS[currentDay as keyof typeof BUSINESS_HOURS]
  const currentDayName = DAY_NAMES[currentDay]

  // Check if closed today
  if (!todayHours) {
    // Find next opening day
    let nextDay = (currentDay + 1) % 7
    let daysUntilOpen = 1

    while (!BUSINESS_HOURS[nextDay as keyof typeof BUSINESS_HOURS] && daysUntilOpen < 7) {
      nextDay = (nextDay + 1) % 7
      daysUntilOpen++
    }

    const nextOpenDay = DAY_NAMES[nextDay]
    const nextOpenHours = BUSINESS_HOURS[nextDay as keyof typeof BUSINESS_HOURS]
    const nextOpenTime = nextOpenHours ? `${String(nextOpenHours.open).padStart(2, '0')}:00` : ''

    return {
      isOpen: false,
      currentDay: currentDayName,
      message: `Fechado - ${currentDayName}`,
      nextOpenTime: `Abre ${nextOpenDay} às ${nextOpenTime}`,
    }
  }

  // Check if currently open
  if (currentTime >= todayHours.open && currentTime < todayHours.close) {
    const closeTime = `${String(todayHours.close).padStart(2, '0')}:00`
    return {
      isOpen: true,
      currentDay: currentDayName,
      message: `Aberto agora - ${currentDayName}`,
      nextOpenTime: `Fecha às ${closeTime}`,
    }
  }

  // Closed but will open later today or tomorrow
  if (currentTime < todayHours.open) {
    // Will open later today
    const openTime = `${String(todayHours.open).padStart(2, '0')}:00`
    return {
      isOpen: false,
      currentDay: currentDayName,
      message: `Fechado - ${currentDayName}`,
      nextOpenTime: `Abre hoje às ${openTime}`,
    }
  } else {
    // Closed for today, find next opening day
    let nextDay = (currentDay + 1) % 7
    let daysUntilOpen = 1

    while (!BUSINESS_HOURS[nextDay as keyof typeof BUSINESS_HOURS] && daysUntilOpen < 7) {
      nextDay = (nextDay + 1) % 7
      daysUntilOpen++
    }

    const nextOpenDay = DAY_NAMES[nextDay]
    const nextOpenHours = BUSINESS_HOURS[nextDay as keyof typeof BUSINESS_HOURS]
    const nextOpenTime = nextOpenHours ? `${String(nextOpenHours.open).padStart(2, '0')}:00` : ''

    return {
      isOpen: false,
      currentDay: currentDayName,
      message: `Fechado - ${currentDayName}`,
      nextOpenTime: daysUntilOpen === 1
        ? `Abre amanhã às ${nextOpenTime}`
        : `Abre ${nextOpenDay} às ${nextOpenTime}`,
    }
  }
}

/**
 * Get formatted business hours for display
 */
export function getFormattedHours(): string[] {
  return [
    'Segunda a Sexta: 09:00 - 19:00',
    'Sábado: 09:00 - 16:00',
    'Domingo: Fechado',
  ]
}
