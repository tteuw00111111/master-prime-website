import { FaArrowRight, FaGoogle, FaMapMarkerAlt } from 'react-icons/fa'
import { Footer } from '@/components/layout/Footer'
import { InnerHeader } from '@/components/layout/InnerHeader'
import { MAPS_URL, serviceSeoPages } from '@/utils/seo'

const clusters = [
  {
    title: 'Notebooks',
    description: 'Tela, dobradiça, placa-mãe, teclado, SSD e RAM, inicialização, imagem, aquecimento e limpeza.',
    rootId: 'conserto-notebook',
    ids: ['notebook-tela', 'notebook-dobradica', 'notebook-placa-mae', 'notebook-upgrade', 'notebook-teclado', 'notebook-nao-liga', 'notebook-sem-imagem', 'notebook-superaquecendo', 'notebook-limpeza'],
  },
  {
    title: 'Computadores e PC gamer',
    description: 'Diagnóstico de desktop, limpeza, falhas de inicialização, SSD, memória, manutenção e upgrades de PC gamer.',
    rootId: 'conserto-computador',
    ids: ['computador-nao-liga', 'computador-upgrade', 'computador-limpeza', 'pc-gamer-manutencao', 'pc-gamer-upgrade'],
  },
  {
    title: 'Celulares',
    description: 'Diagnóstico de aparelho, troca de tela e bateria e avaliação para reparo de placa.',
    rootId: 'conserto-celular',
    ids: ['celular-tela', 'celular-bateria', 'celular-placa'],
  },
  {
    title: 'Videogames e controles',
    description: 'Manutenção de consoles e controles, diagnóstico de drift e Hall Effect quando compatível.',
    rootId: 'videogame-conserto',
    ids: ['controle-conserto', 'controle-drift'],
  },
] as const

const pageById = new Map(serviceSeoPages.map((page) => [page.id, page]))

export const ServicesHub = () => (
  <div className="min-h-screen overflow-x-hidden bg-black text-white">
    <InnerHeader />
    <main>
      <section className="relative overflow-hidden border-b border-white/5 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.14),transparent_52%)]" />
        <div className="container-custom relative z-10 max-w-5xl text-center">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-400">
            <a href="/" className="hover:text-gold">Início</a> <span aria-hidden="true">/</span> <span aria-current="page">Serviços</span>
          </nav>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Assistência técnica em Campo Grande</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Serviços da Master Prime Assistência</h1>
          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-gray-300">Encontre a página correspondente ao equipamento ou sintoma. Cada atendimento começa pela avaliação: problemas parecidos podem envolver componentes diferentes, e compatibilidade é confirmada antes da indicação.</p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-400">A Master Prime atende notebook, computador, PC gamer, celular, videogame e controle. Impressoras não fazem parte dos serviços atuais.</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-custom space-y-10">
          {clusters.map((cluster) => {
            const root = pageById.get(cluster.rootId)
            const pages = cluster.ids.map((id) => pageById.get(id)).filter(Boolean)
            if (!root) return null

            return (
              <article key={cluster.title} className="rounded-[2rem] border border-white/10 bg-dark-card p-6 md:p-9">
                <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <div>
                    <h2 className="text-3xl font-black">{cluster.title}</h2>
                    <p className="mt-4 leading-7 text-gray-400">{cluster.description}</p>
                    <a href={root.path} className="mt-6 inline-flex items-center gap-2 font-bold text-gold hover:underline">
                      {root.title} <FaArrowRight aria-hidden="true" />
                    </a>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {pages.map((page) => page && (
                      <li key={page.path}>
                        <a href={page.path} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold transition-colors hover:border-gold/50 hover:text-gold">
                          <span>{page.title}</span><FaArrowRight className="shrink-0" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="border-y border-white/5 bg-dark-lighter py-16">
        <div className="container-custom grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-black">Loja física em Campo Grande</h2>
            <p className="mt-4 flex gap-3 leading-7 text-gray-300"><FaMapMarkerAlt className="mt-1 shrink-0 text-gold" aria-hidden="true" /><span>Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ</span></p>
          </div>
          <div className="rounded-2xl border border-gold/20 bg-black/50 p-6">
            <p className="text-lg font-bold">Mais de 600 avaliações no Google</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">Consulte o perfil para ver as avaliações reais e o número atualizado.</p>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-gold hover:underline"><FaGoogle aria-hidden="true" /> Ver perfil no Google</a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
)
