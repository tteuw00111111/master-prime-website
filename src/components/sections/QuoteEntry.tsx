import { FiArrowRight, FiCpu, FiGrid, FiMonitor, FiSmartphone } from 'react-icons/fi'
import { FaGamepad, FaLaptop } from 'react-icons/fa'
import { QUOTE_DESTINATIONS } from '@/data/quote-entry'

const devices = [
  { id: 'smartphone', label: 'Celular', description: 'Tela, bateria, carga ou outro problema.', icon: FiSmartphone },
  { id: 'notebook', label: 'Notebook', description: 'Reparo, limpeza ou upgrade.', icon: FaLaptop },
  { id: 'computer', label: 'Computador', description: 'Manutenção do seu desktop.', icon: FiMonitor },
  { id: 'pcGamer', label: 'PC gamer', description: 'Reparo ou upgrade do PC que já tem.', icon: FiCpu },
  { id: 'console', label: 'Videogame', description: 'Problemas ou manutenção do console.', icon: FiGrid },
  { id: 'controller', label: 'Controle', description: 'Drift, botões ou conexão.', icon: FaGamepad },
] as const

export const QuoteEntry = () => (
  <section id="orcamento" aria-labelledby="quote-entry-title" className="home-quote-entry border-y border-white/10 bg-[#080808] py-16 md:py-24">
    <div className="container-custom grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div>
        <h2 id="quote-entry-title" className="text-3xl font-black leading-tight md:text-5xl">
          Seu orçamento<br /><span className="text-gold">começa aqui.</span>
        </h2>
        <p className="mt-5 max-w-md text-base leading-7 text-gray-300">
          Escolha o aparelho e conte o que precisa. Depois de revisar o pedido, você continua com a equipe pelo WhatsApp.
        </p>
        <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
          Valores e condições são confirmados pela equipe. Para reparos, o equipamento passa por avaliação técnica.
        </p>
      </div>

      <div>
        <h3 className="mb-5 text-lg font-semibold">Para qual aparelho?</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {devices.map(({ id, label, description, icon: Icon }) => (
            <li key={id}>
              <a href={QUOTE_DESTINATIONS[id]} className="home-quote-option group flex h-full items-center gap-4 rounded-2xl border border-white/15 bg-black p-5" aria-label={`Solicitar orçamento de ${label.toLowerCase()}`}>
                <Icon aria-hidden="true" className="shrink-0 text-2xl text-gold" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-white">{label}</span>
                  <span className="mt-1 block text-sm leading-6 text-gray-400">{description}</span>
                </span>
                <FiArrowRight aria-hidden="true" className="home-quote-arrow shrink-0 text-gold" />
              </a>
            </li>
          ))}
        </ul>
        <a href={QUOTE_DESTINATIONS.pcBuild} className="home-quote-option group mt-5 flex items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-5">
          <span>
            <span className="block text-lg font-bold text-gold">Quer montar um PC?</span>
            <span className="mt-1 block text-sm leading-6 text-gray-300">Planeje um PC novo ou a montagem com suas peças.</span>
          </span>
          <FiArrowRight aria-hidden="true" className="home-quote-arrow shrink-0 text-xl text-gold" />
        </a>
      </div>
    </div>
  </section>
)
