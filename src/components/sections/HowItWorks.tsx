import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { HOW_IT_WORKS } from '@/utils/constants'
import { staggerContainer, staggerItem } from '@/utils/animations'

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-gold/10 rounded-full blur-xl"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * -100, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <FloatingParticles />

      <div className="container-custom relative z-10">
        <SectionHeading
          title="Como Funciona?"
          subtitle=""
          className="mb-16 md:mb-24 text-center"
        />

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[26px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

          {/* Steps Container */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10"
          >
            {HOW_IT_WORKS.map((step) => (
              <motion.div
                key={step.step}
                variants={staggerItem}
                className="flex flex-col items-center text-center group cursor-default"
              >
                {/* Pill Step */}
                <motion.div 
                  className="relative mb-6"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card
                    variant="revealed-pointer"
                    className="flex items-center gap-3 !p-0 border-white/10 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all duration-300"
                    style={{
                      borderRadius: '75px',
                      height: '53px',
                    }}
                  >
                    <div className="flex items-center gap-3 px-2 py-2 pr-6">
                      {/* Icon Circle */}
                      <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 text-black group-hover:rotate-12 transition-transform duration-300">
                        <step.icon className="text-xl" />
                      </div>
                      
                      {/* Step Title */}
                      <span className="text-sm font-bold text-white whitespace-nowrap group-hover:text-gold transition-colors duration-300">
                        {step.title}
                      </span>
                    </div>
                  </Card>
                </motion.div>

                {/* Description */}
                <p className="text-xs md:text-[11px] lg:text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto px-2 group-hover:text-white transition-colors duration-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
