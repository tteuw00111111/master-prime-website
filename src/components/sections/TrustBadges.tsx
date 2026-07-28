import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { TRUST_BADGES } from '@/utils/constants'
import { staggerContainer, staggerItem } from '@/utils/animations'

export const TrustBadges = () => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center">
        {TRUST_BADGES.map((badge, index) => (
          <motion.div
            key={index}
            variants={staggerItem}
          >
            <Card
              variant="revealed-pointer"
              className="flex items-center justify-center !p-0"
              style={{
                width: '251px',
                height: '53px',
                borderRadius: '75px',
              }}
            >
              <div className="flex items-center justify-center gap-3 w-full h-full px-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <badge.icon className="text-3xl text-white" />
                </div>

                {/* Text Content */}
                <div className="flex-1 text-left">
                  {index === 0 && (
                    <p className="text-[13px] text-white leading-tight whitespace-nowrap">
                      Retirada <span className="font-britanica font-black">e entrega</span>
                    </p>
                  )}
                  {index === 1 && (
                    <p className="text-[13px] text-white leading-tight">
                      Suporte <span className="font-britanica font-black">via WhatsApp</span>
                    </p>
                  )}
                  {index === 2 && (
                    <p className="text-[13px] text-white leading-tight">
                      Loja física em <span className="font-britanica font-black">Campo Grande</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
