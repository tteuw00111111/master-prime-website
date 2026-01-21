import { motion, Variants } from 'framer-motion'
import { useRef } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface ScrollRevealProps {
  children: React.ReactNode
  variants?: Variants
  delay?: number
  className?: string
  threshold?: number
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variants,
  delay = 0,
  className = '',
  threshold = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, {
    threshold,
    freezeOnceVisible: true,
  })

  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants || defaultVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
