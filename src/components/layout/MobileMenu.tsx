import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from './Navigation'
import { Button } from '@/components/ui/Button'
import { FiArrowRight } from 'react-icons/fi'
import { HOME_QUOTE_HREF } from '@/data/quote-entry'
import { mobileMenuAnimation, mobileMenuBackdrop } from '@/utils/animations'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  activeSection?: string
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activeSection,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuBackdrop}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-dark border-l border-gold/20 z-50 lg:hidden overflow-y-auto"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuAnimation}
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-8 pt-16">
                <h2 className="text-2xl font-heading font-bold text-white mb-2">
                  Master <span className="text-gold">Prime</span>
                </h2>
                <p className="text-gray-400 text-sm">Assistência Técnica em Campo Grande</p>
              </div>

              {/* Navigation */}
              <div className="mb-8">
                <Navigation
                  activeSection={activeSection}
                  isMobile
                  onLinkClick={onClose}
                />
              </div>

              {/* CTA Button */}
              <div className="pt-4 border-t border-gold/20">
                <Button
                  variant="primary"
                  size="md"
                  icon={FiArrowRight}
                  href={HOME_QUOTE_HREF}
                  onClick={onClose}
                  className="w-full"
                >
                  Solicitar orçamento
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
