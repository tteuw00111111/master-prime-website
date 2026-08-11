import { FaCheck, FaGoogle, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa'
import { Footer } from '@/components/layout/Footer'
import { InnerHeader } from '@/components/layout/InnerHeader'
import { ExperienceImage } from '@/components/seo/ExperienceImage'
import type { ServiceSeoPage } from '@/types/seo'
import { getBreadcrumbs, MAPS_URL, serviceSeoPages } from '@/utils/seo'
import { getWhatsAppServiceUrl, trackWhatsAppService } from '@/utils/whatsapp'

interface ServicePageProps {
  page: ServiceSeoPage
}

export const ServicePage = ({ page }: ServicePageProps) => {
  const breadcrumbs = getBreadcrumbs(page)
  const relatedPages = page.related
    .map((id) => serviceSeoPages.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ServiceSeoPage => Boolean(candidate))
  const whatsappUrl = getWhatsAppServiceUrl(page.title)

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <InnerHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/5 py-12 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,0.12),transparent_45%)]" />
          <div className="container-custom relative z-10">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-400">
              <ol className="flex flex-wrap items-center gap-2">
                {breadcrumbs.map((item, index) => (
                  <li key={item.path} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">/</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span aria-current="page" className="text-gray-300">{item.name}</span>
                    ) : (
                      <a href={item.path} className="transition-colors hover:text-gold">{item.name}</a>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="max-w-4xl">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-gold">{page.eyebrow}</p>
                <h1 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl">{page.title}</h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-gray-300">{page.answer}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={whatsappUrl}
                    onClick={() => trackWhatsAppService(page.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-bold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <FaWhatsapp aria-hidden="true" /> Solicitar avaliação
                  </a>
                  <a href="#como-funciona" className="inline-flex min-h-12 items-center rounded-full border border-gold/50 px-6 py-3 font-bold text-gold transition-colors hover:bg-gold hover:text-black">
                    Entender o diagnóstico
                  </a>
                </div>
              </div>

              <aside className="rounded-3xl border border-gold/20 bg-dark-card p-6" aria-label="Informações da Master Prime">
                <p className="font-heading text-xl font-bold">Atendimento em loja física</p>
                <p className="mt-3 flex gap-3 text-sm leading-6 text-gray-300">
                  <FaMapMarkerAlt className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                  <span>Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ</span>
                </p>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline">
                  <FaGoogle aria-hidden="true" /> Ver perfil e avaliações no Google
                </a>
                <p className="mt-4 border-t border-white/10 pt-4 text-sm text-gray-400">Mais de 600 avaliações no Google. O número exato não é fixado no código.</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-custom grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{page.symptomsHeading}</h2>
              <ul className="mt-8 space-y-4">
                {page.symptoms.map((symptom) => (
                  <li key={symptom} className="flex gap-3 leading-7 text-gray-300">
                    <FaCheck className="mt-1.5 shrink-0 text-gold" aria-hidden="true" />
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{page.causesHeading}</h2>
              <div className="mt-8 space-y-4">
                {page.causes.map((cause) => (
                  <article key={cause.title} className="rounded-2xl border border-white/10 bg-dark-card p-5">
                    <h3 className="text-lg font-bold text-gold">{cause.title}</h3>
                    <p className="mt-2 leading-7 text-gray-300">{cause.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-white/5 bg-dark-lighter py-16 md:py-24">
          <div className="container-custom">
            <h2 className="max-w-3xl text-3xl font-bold md:text-4xl">{page.processHeading}</h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {page.process.map((step, index) => (
                <li key={step.title} className="rounded-3xl border border-gold/15 bg-black/50 p-6">
                  <span className="text-sm font-black text-gold">0{index + 1}</span>
                  <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-gray-400">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-custom grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{page.decisionHeading}</h2>
              <p className="mt-6 max-w-4xl text-lg leading-8 text-gray-300">{page.decision}</p>
            </div>
            <div className="rounded-3xl border border-gold/20 bg-[linear-gradient(135deg,rgba(255,215,0,0.12),rgba(10,10,10,0.8))] p-6">
              <h2 className="text-xl font-bold">O sintoma não substitui o diagnóstico</h2>
              <p className="mt-3 leading-7 text-gray-300">Informe aparelho, modelo e comportamento. A equipe confirma o atendimento e a intervenção aplicável após avaliar o equipamento.</p>
            </div>
          </div>
          <ExperienceImage brief={page.photoBrief} />
        </section>

        <section className="border-y border-white/5 bg-dark-lighter py-16 md:py-24">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
            <div className="mt-8 space-y-4">
              {page.faq.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-white/10 bg-black/50 p-5">
                  <summary className="cursor-pointer list-none pr-6 text-lg font-bold text-white marker:content-none">{item.question}</summary>
                  <p className="mt-4 border-t border-white/10 pt-4 leading-7 text-gray-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-custom">
            <h2 className="text-3xl font-bold md:text-4xl">Serviços relacionados</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedPages.map((related) => (
                <a key={related.path} href={related.path} className="rounded-2xl border border-white/10 bg-dark-card p-6 transition-colors hover:border-gold/50">
                  <p className="text-sm font-bold uppercase tracking-wider text-gold">{related.clusterName}</p>
                  <h3 className="mt-3 text-xl font-bold">{related.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{related.metaDescription}</p>
                </a>
              ))}
            </div>
            <div className="mt-8">
              <a href={page.clusterPath} className="font-bold text-gold hover:underline">Ver o cluster de {page.clusterName.toLowerCase()} →</a>
            </div>
          </div>
        </section>

        <section className="border-t border-gold/10 bg-gold py-12 text-black">
          <div className="container-custom flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">Precisa avaliar este problema?</h2>
              <p className="mt-2 max-w-2xl text-black/75">Envie o modelo e o sintoma pelo WhatsApp ou visite a Master Prime em Campo Grande.</p>
            </div>
            <a href={whatsappUrl} onClick={() => trackWhatsAppService(page.title)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white">
              <FaWhatsapp aria-hidden="true" /> Falar com a equipe
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
