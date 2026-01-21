import { motion } from 'framer-motion'
import { cardHover } from '@/utils/animations'
import { useRef, useState } from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  onClick?: () => void
  variant?: 'default' | 'revealed-pointer'
  style?: React.CSSProperties
  pointerColor?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
  variant = 'default',
  style,
  pointerColor = 'rgba(255, 255, 255, 0.1)',
}) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0, opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return

    const div = divRef.current
    const rect = div.getBoundingClientRect()

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 })
  }

  const handleMouseEnter = () => {
    setPosition((prev) => ({ ...prev, opacity: 1 }))
  }

  const handleMouseLeave = () => {
    setPosition((prev) => ({ ...prev, opacity: 0 }))
  }

  const baseClasses = 'rounded-xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden'

  const variantClasses = glass
    ? 'glass-card'
    : 'bg-dark-card border border-gold/20'

  const hoverClasses = hover ? 'cursor-pointer hover:border-gold/40' : ''

  const classes = `${baseClasses} ${variantClasses} ${hoverClasses} ${className}`

  if (variant === 'revealed-pointer') {
    return (
      <div
        ref={divRef}
        className={`${baseClasses} bg-black/40 backdrop-blur-md border border-white/10 ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={style}
      >
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
          style={{
            opacity: position.opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${pointerColor}, transparent 40%)`,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  if (hover) {
    return (
      <motion.div
        className={classes}
        whileHover={cardHover}
        onClick={onClick}
        style={style}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  )
}
