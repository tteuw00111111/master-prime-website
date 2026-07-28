import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TESTIMONIALS } from '@/utils/constants'
import { staggerContainer, staggerItem } from '@/utils/animations'

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-black relative">
      <div className="container-custom">
        <SectionHeading
          title="Clientes Satisfeitos"
          subtitle="Veja o que nossos clientes dizem sobre nossos serviços"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={staggerItem}
              className="h-full group"
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <a 
                href={testimonial.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block h-full cursor-pointer"
              >
                <Card
                  variant="revealed-pointer"
                  pointerColor="rgba(255, 215, 0, 0.2)"
                  className="h-full flex flex-col border-white/10 transition-all duration-300 group-hover:border-gold/50 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] group-hover:bg-black/60"
                >
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="text-gold text-lg transition-transform duration-200 group-hover:scale-110"
                        style={{ transitionDelay: `${i * 30}ms` }}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-300 leading-relaxed mb-6 flex-grow italic text-sm">
                    "{testimonial.text}"
                  </p>

                  {/* Author Info */}
                  <div className="pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-3">
                      {/* Avatar Placeholder */}
                      <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 text-black font-bold">
                        {testimonial.name.charAt(0)}
                      </div>

                      {/* Name & Date */}
                      <div>
                        <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{testimonial.date}</span>
                          <span>•</span>
                          <span className="text-gold hover:underline">Ver no Google</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400 text-sm">
            Mais de <span className="text-gold font-bold">500 avaliações com 5 estrelas</span> no Google
          </p>
        </motion.div>
      </div>
    </section>
  )
}
