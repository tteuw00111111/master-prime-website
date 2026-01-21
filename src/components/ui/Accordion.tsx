import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus } from 'react-icons/fa'
import { accordionAnimation } from '@/utils/animations'

interface AccordionProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

export const Accordion: React.FC<AccordionProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="border border-gold/20 rounded-lg overflow-hidden bg-dark-card hover:border-gold/40 transition-colors duration-300">
      {/* Question Header */}
      <button
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gold/5 transition-colors duration-300"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-heading font-semibold text-base md:text-lg text-white pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          {isOpen ? (
            <FaMinus className="text-gold text-xl" />
          ) : (
            <FaPlus className="text-gold text-xl" />
          )}
        </motion.div>
      </button>

      {/* Answer Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={accordionAnimation}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-gray-400 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
