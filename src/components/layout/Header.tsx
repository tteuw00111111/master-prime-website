import { motion } from 'framer-motion'
import { navAnimation } from '@/utils/animations'
import logoImage from '@/assets/images/logo.webp'

export const Header = () => {
  return (
    <motion.header
      className="absolute top-4 sm:top-6 md:top-8 lg:top-6 xl:top-8 left-0 right-0 z-50 pointer-events-auto"
      initial="hidden"
      animate="visible"
      variants={navAnimation}
    >
      <div className="flex items-center justify-center w-full">
        {/* Logo - Centered and Large */}
        <a
          href="/"
          className="group"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        >
          <img
            src={logoImage}
            width="639"
            height="376"
            alt="Master Prime Assistência"
            className="h-12 sm:h-16 md:h-20 lg:h-24 xl:h-32 2xl:h-40 w-auto transition-transform group-hover:scale-105"
          />
        </a>
      </div>
    </motion.header>
  )
}
