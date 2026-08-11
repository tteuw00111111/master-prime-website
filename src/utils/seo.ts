import seoPagesData from '@/data/seo-pages.json'
import type { ServiceSeoPage } from '@/types/seo'

export const SITE_URL = 'https://master-prime.com'
export const BUSINESS_ID = `${SITE_URL}/#localbusiness`
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Avenida%20Ces%C3%A1rio%20de%20Melo%2C%202571%2C%20Campo%20Grande%2C%20Rio%20de%20Janeiro%2C%20RJ%2C%2023052-102'

export const serviceSeoPages = seoPagesData as ServiceSeoPage[]

export const normalizePath = (pathname: string) => {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

export const getServicePage = (pathname: string) =>
  serviceSeoPages.find((page) => page.path === normalizePath(pathname))

export interface PageMetadata {
  title: string
  description: string
  canonical: string
  ogType: 'website'
}

export const HOME_METADATA: PageMetadata = {
  title: 'Assistência Técnica em Campo Grande RJ | Master Prime',
  description: 'Conserto de celular, notebook, computador, PC gamer, videogame e controle em Campo Grande, RJ. Loja física e atendimento pelo WhatsApp.',
  canonical: `${SITE_URL}/`,
  ogType: 'website',
}

export const SERVICES_METADATA: PageMetadata = {
  title: 'Serviços de Assistência Técnica | Master Prime Campo Grande',
  description: 'Conheça os serviços da Master Prime para notebook, computador, PC gamer, celular, videogame e controle em Campo Grande, Rio de Janeiro.',
  canonical: `${SITE_URL}/servicos`,
  ogType: 'website',
}

export const getPageMetadata = (pathname: string): PageMetadata => {
  const path = normalizePath(pathname)
  if (path === '/') return HOME_METADATA
  if (path === '/servicos') return SERVICES_METADATA

  const page = getServicePage(path)
  if (page) {
    return {
      title: page.metaTitle,
      description: page.metaDescription,
      canonical: `${SITE_URL}${page.path}`,
      ogType: 'website',
    }
  }

  return {
    title: 'Página não encontrada | Master Prime Assistência',
    description: 'A página solicitada não foi encontrada.',
    canonical: `${SITE_URL}${path}`,
    ogType: 'website',
  }
}

export const getLocalBusinessSchema = () => ({
  '@type': 'LocalBusiness',
  '@id': BUSINESS_ID,
  name: 'Master Prime Assistência',
  alternateName: 'Master Prime',
  url: `${SITE_URL}/`,
  telephone: '+55 21 96763-5340',
  email: 'masterprime443@gmail.com',
  description: 'Assistência técnica de eletrônicos e informática em Campo Grande, Rio de Janeiro.',
  image: `${SITE_URL}/apple-touch-icon.png`,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Avenida Cesário de Melo, 2571',
    addressLocality: 'Rio de Janeiro',
    addressRegion: 'RJ',
    postalCode: '23052-102',
    addressCountry: 'BR',
  },
  hasMap: MAPS_URL,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '16:00',
    },
  ],
  sameAs: ['https://www.instagram.com/masterprimecg/'],
  areaServed: {
    '@type': 'Place',
    name: 'Campo Grande, Rio de Janeiro',
  },
})

const serviceCatalog = [
  ['Assistência técnica de notebook', '/conserto-de-notebook-campo-grande-rj'],
  ['Assistência técnica de computador', '/conserto-de-computador-campo-grande-rj'],
  ['Manutenção de PC gamer', '/manutencao-de-pc-gamer'],
  ['Assistência técnica de celular', '/conserto-de-celular-campo-grande-rj'],
  ['Conserto de videogame', '/conserto-de-videogame'],
  ['Conserto de controle', '/conserto-de-controle'],
] as const

const homeCatalogSchema = {
  '@type': 'OfferCatalog',
  name: 'Serviços atuais da Master Prime Assistência',
  itemListElement: serviceCatalog.map(([name, path]) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
      url: `${SITE_URL}${path}`,
      provider: { '@id': BUSINESS_ID },
    },
  })),
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export const getBreadcrumbs = (page?: ServiceSeoPage): BreadcrumbItem[] => {
  if (!page) return [{ name: 'Início', path: '/' }, { name: 'Serviços', path: '/servicos' }]

  const items: BreadcrumbItem[] = [
    { name: 'Início', path: '/' },
    { name: 'Serviços', path: '/servicos' },
  ]

  if (page.path !== page.clusterPath) {
    items.push({ name: page.clusterName, path: page.clusterPath })
  }

  items.push({ name: page.title, path: page.path })
  return items
}

const breadcrumbSchema = (items: BreadcrumbItem[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === '/' ? '/' : item.path}`,
  })),
})

export const getPageSchemas = (pathname: string) => {
  const path = normalizePath(pathname)
  const localBusiness = getLocalBusinessSchema()

  if (path === '/') {
    return [{
      '@context': 'https://schema.org',
      '@graph': [{ ...localBusiness, hasOfferCatalog: homeCatalogSchema }],
    }]
  }

  if (path === '/servicos') {
    return [{
      '@context': 'https://schema.org',
      '@graph': [
        localBusiness,
        breadcrumbSchema(getBreadcrumbs()),
        {
          '@type': 'ItemList',
          name: 'Serviços da Master Prime Assistência',
          itemListElement: serviceCatalog.map(([name, servicePath], index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name,
            url: `${SITE_URL}${servicePath}`,
          })),
        },
      ],
    }]
  }

  const page = getServicePage(path)
  if (!page) return []

  return [{
    '@context': 'https://schema.org',
    '@graph': [
      localBusiness,
      {
        '@type': 'Service',
        '@id': `${SITE_URL}${page.path}#service`,
        name: page.title,
        serviceType: page.title,
        url: `${SITE_URL}${page.path}`,
        description: page.metaDescription,
        provider: { '@id': BUSINESS_ID },
        areaServed: { '@type': 'Place', name: 'Campo Grande, Rio de Janeiro' },
      },
      breadcrumbSchema(getBreadcrumbs(page)),
    ],
  }]
}

export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/servicos',
  ...serviceSeoPages.map((page) => page.path),
  '/politica-de-privacidade',
]
