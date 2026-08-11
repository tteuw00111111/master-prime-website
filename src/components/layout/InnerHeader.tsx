import { FaWhatsapp } from 'react-icons/fa'
import logoImage from '@/assets/images/logo.webp'
import { getWhatsAppQuoteUrl, trackWhatsAppQuote } from '@/utils/whatsapp'

export const InnerHeader = () => (
  <header className="border-b border-gold/10 bg-black/95">
    <div className="container-custom flex min-h-20 items-center justify-between gap-4 py-3">
      <a href="/" className="shrink-0" aria-label="Master Prime Assistência — início">
        <img
          src={logoImage}
          width="639"
          height="376"
          alt="Master Prime Assistência"
          className="h-12 w-auto md:h-14"
        />
      </a>
      <nav aria-label="Navegação principal" className="flex items-center gap-4">
        <a href="/servicos" className="hidden text-sm font-semibold text-white transition-colors hover:text-gold sm:inline">
          Serviços
        </a>
        <a
          href={getWhatsAppQuoteUrl()}
          onClick={trackWhatsAppQuote}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-whatsapp px-4 py-2 text-sm font-bold text-whatsapp transition-colors hover:bg-whatsapp hover:text-white"
        >
          <FaWhatsapp aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </nav>
    </div>
  </header>
)
