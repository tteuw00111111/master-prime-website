import { useState } from 'react'
import { motion } from 'framer-motion'
import { Accordion } from '@/components/ui/Accordion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FAQ_ITEMS } from '@/utils/constants'
import { staggerContainer, staggerItem } from '@/utils/animations'

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0) // First item open by default

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 md:py-24 bg-dark-lighter relative">
      <div className="container-custom">
        <SectionHeading
          title="Perguntas Frequentes"
          subtitle="Tire suas dúvidas sobre nossos serviços"
        />

        <motion.div
          className="max-w-3xl mx-auto space-y-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {FAQ_ITEMS.map((item, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Accordion
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400 mb-4">
            Não encontrou a resposta que procurava?
          </p>
          <a
            href="https://wa.me/5521999999999?text=Olá!%20Tenho%20uma%20dúvida."
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-light transition-colors font-semibold"
          >
            Entre em contato conosco →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
