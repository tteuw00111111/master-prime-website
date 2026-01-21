import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from './Navigation'
import { Button } from '@/components/ui/Button'
import { FaWhatsapp } from 'react-icons/fa'
import { openWhatsAppForQuote } from '@/utils/whatsapp'
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
                <p className="text-gray-400 text-sm">Peças e Acessórios para Eletrônicos</p>
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
                  variant="whatsapp"
                  size="md"
                  icon={FaWhatsapp}
                  onClick={() => {
                    openWhatsAppForQuote()
                    onClose()
                  }}
                  className="w-full"
                >
                  Orçamento Grátis
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
