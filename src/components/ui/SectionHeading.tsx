import { motion } from 'framer-motion'
import { fadeInUp } from '@/utils/animations'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const alignmentClasses = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <motion.div
      className={`max-w-3xl mb-12 md:mb-16 ${alignmentClasses} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
        {title.split(' ').map((word, index) => {
          // Highlight certain words with gold
          const highlightWords = ['Serviços', 'Funciona', 'Clientes', 'FAQ', 'Visitar']
          const isHighlighted = highlightWords.some((hw) => word.includes(hw))

          return (
            <span
              key={index}
              className={isHighlighted ? 'text-gradient' : 'text-white'}
            >
              {word}{' '}
            </span>
          )
        })}
      </h2>

      {subtitle && (
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Decorative line */}
      <div className={`mt-6 h-1 w-20 bg-gradient-to-r from-gold to-gold-light ${align === 'center' ? 'mx-auto' : ''}`} />
    </motion.div>
  )
}
