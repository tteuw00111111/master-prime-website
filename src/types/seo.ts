export interface SeoDetail {
  title: string
  description: string
}

export interface SeoFaq {
  question: string
  answer: string
}

export interface ServiceSeoPage {
  id: string
  path: string
  clusterPath: string
  clusterName: string
  title: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  answer: string
  symptomsHeading: string
  symptoms: string[]
  causesHeading: string
  causes: SeoDetail[]
  processHeading: string
  process: SeoDetail[]
  decisionHeading: string
  decision: string
  faq: SeoFaq[]
  related: string[]
  photoBrief: string
}
