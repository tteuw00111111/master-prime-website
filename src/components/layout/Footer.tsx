import { FaWhatsapp, FaInstagram, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa'
import { SITE_CONFIG, NAVIGATION_ITEMS } from '@/utils/constants'
import { openWhatsAppForQuote } from '@/utils/whatsapp'
import logoImage from '@/assets/images/logo.webp'

export const Footer = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-dark-lighter border-t border-gold/10">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <img
              src={logoImage}
              alt="Master Prime"
              className="h-12 w-auto"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              Loja de peças e acessórios para smartphones, tablets, notebooks e consoles.
              Garantia de 1 ano em todos os produtos.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              {SITE_CONFIG.social?.instagram && (
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-dark transition-all"
                  aria-label="Instagram"
                >
                  <FaInstagram className="text-xl" />
                </a>
              )}
              <button
                onClick={() => openWhatsAppForQuote()}
                className="w-10 h-10 rounded-full bg-whatsapp/10 flex items-center justify-center text-whatsapp hover:bg-whatsapp hover:text-white transition-all"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="text-xl" />
              </button>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-gray-400 hover:text-gold transition-colors text-sm"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <FaMapMarkerAlt className="text-gold mt-1 flex-shrink-0" />
                <span className="text-gray-400">
                  {SITE_CONFIG.address.street}<br />
                  {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <FaEnvelope className="text-gold flex-shrink-0" />
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="text-gray-400 hover:text-gold transition-colors"
                >
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <FaWhatsapp className="text-gold flex-shrink-0" />
                <button
                  onClick={() => openWhatsAppForQuote()}
                  className="text-gray-400 hover:text-gold transition-colors text-left"
                >
                  WhatsApp
                </button>
              </li>
            </ul>
          </div>

          {/* Hours Column */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">Horário</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FaClock className="text-gold mt-1 flex-shrink-0" />
                <div className="text-gray-400">
                  <p>{SITE_CONFIG.hours.weekdays}</p>
                  <p>{SITE_CONFIG.hours.saturday}</p>
                  <p className="text-red-400">{SITE_CONFIG.hours.sunday}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gold/10 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Master Prime. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
