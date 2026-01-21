import { motion } from 'framer-motion'
import { IconType } from 'react-icons'
import { glassButtonHover, glassButtonTap } from '@/utils/animations'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'glass' | 'whatsapp' | 'whatsapp-outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconType
  iconClassName?: string
  onClick?: () => void
  href?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  style?: React.CSSProperties
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconClassName = '',
  onClick,
  href,
  className = '',
  type = 'button',
  disabled = false,
  style,
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 cursor-pointer'

  const variantClasses = {
    primary: 'bg-gold text-dark hover:bg-gold-light hover:shadow-lg hover:shadow-gold/30',
    secondary: 'bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-dark',
    glass: 'glass-button text-white',
    whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp/90 hover:shadow-lg hover:shadow-whatsapp/30',
    'whatsapp-outline': 'border border-whatsapp bg-transparent text-whatsapp backdrop-blur-md hover:bg-whatsapp hover:text-white transition-all duration-500 relative overflow-hidden',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base md:px-8 md:py-4',
    lg: 'px-8 py-4 text-lg md:px-10 md:py-5',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`

  const content = (
    <>
      {Icon && <Icon className={iconClassName || "text-xl"} />}
      <span>{children}</span>
    </>
  )

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        style={style}
        whileHover={!disabled ? glassButtonHover : undefined}
        whileTap={!disabled ? glassButtonTap : undefined}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.button
      type={type}
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? glassButtonHover : undefined}
      whileTap={!disabled ? glassButtonTap : undefined}
    >
      {content}
    </motion.button>
  )
}
