import { IconType } from 'react-icons'
import { Card } from './Card'

interface BadgeProps {
  icon: IconType
  title: string
  description: string
}

export const Badge: React.FC<BadgeProps> = ({ icon: Icon, title, description }) => {
  return (
    <Card className="text-center" hover glass>
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
          <Icon className="text-3xl text-gold" />
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-sm md:text-base text-white uppercase tracking-wide">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </Card>
  )
}
