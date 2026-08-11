import { NAVIGATION_ITEMS } from '@/utils/constants'

interface NavigationProps {
  activeSection?: string
  isMobile?: boolean
  onLinkClick?: () => void
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  isMobile = false,
  onLinkClick,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const targetId = href.split('#')[1]
    if (!targetId || window.location.pathname !== '/') return
    e.preventDefault()
    const element = document.getElementById(targetId)

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }

    if (onLinkClick) {
      onLinkClick()
    }
  }

  const linkBaseClasses = isMobile
    ? 'block py-4 px-6 text-lg font-semibold transition-colors'
    : 'relative px-4 py-2 font-medium transition-colors'

  return (
    <nav>
      <ul className={isMobile ? 'space-y-2' : 'flex items-center gap-1'}>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = activeSection === item.href.split('#')[1]

          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={`${linkBaseClasses} ${
                  isActive
                    ? 'text-gold'
                    : 'text-white hover:text-gold'
                } ${isMobile ? 'hover:bg-gold/10' : ''}`}
              >
                {item.name}

                {/* Underline indicator for desktop */}
                {!isMobile && (
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gold transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
