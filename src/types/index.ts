import { IconType } from 'react-icons'

export interface TrustBadge {
  icon: IconType
  title: string
  description: string
}

export interface Service {
  id: number
  name: string
  description: string
  icon: IconType
  devices: string[]
  price?: string
}

export interface Step {
  step: number
  title: string
  description: string
  icon: IconType
}

export interface Testimonial {
  id: number
  name: string
  rating: number
  text: string
  date: string
  image?: string
  link?: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface SiteConfig {
  name: string
  tagline: string
  location: string
  whatsappNumber: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  hours: {
    weekdays: string
    saturday: string
    sunday: string
  }
  social?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
}

export interface NavigationItem {
  name: string
  href: string
}
