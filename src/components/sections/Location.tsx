import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaWhatsapp, FaInstagram, FaPhone } from 'react-icons/fa'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Magnetic } from '@/components/ui/Magnetic'
import { SITE_CONFIG } from '@/utils/constants'
import { openWhatsAppForVisit, openWhatsAppForQuote } from '@/utils/whatsapp'
import { slideInLeft, slideInRight } from '@/utils/animations'
import { getOpeningStatus, getFormattedHours } from '@/utils/openingHours'

export const Location = () => {
  const [openStatus, setOpenStatus] = useState(getOpeningStatus())

  // Update status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setOpenStatus(getOpeningStatus())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const formattedHours = getFormattedHours()

  return (
    <section id="location" className="py-16 md:py-24 bg-black relative">
      <div className="container-custom">
        <SectionHeading
          title="Venha Nos Visitar"
          subtitle="Estamos prontos para atender você"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Map */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
            className="relative"
          >
            <div className="relative h-[400px] rounded-2xl overflow-hidden border border-gold/20">
              {/* Google Maps Embed */}
              <iframe
                src={import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Master Prime"
              />
            </div>
          </motion.div>

          {/* Right Side - Info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
            className="space-y-8"
          >
            {/* Address */}
            <div className="flex gap-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FaMapMarkerAlt className="text-xl text-gold" />
              </motion.div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">
                  Endereço
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {SITE_CONFIG.address.street}<br />
                  {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}<br />
                  CEP: {SITE_CONFIG.address.zip}
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <FaClock className="text-xl text-gold" />
              </motion.div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">
                  Horário de Funcionamento
                </h3>

                {/* Dynamic Status */}
                <div className="mb-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${openStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`font-semibold ${openStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                      {openStatus.message}
                    </span>
                  </div>
                  {openStatus.nextOpenTime && (
                    <p className="text-gray-300 text-sm ml-4">
                      {openStatus.nextOpenTime}
                    </p>
                  )}
                </div>

                {/* Full Schedule */}
                <div className="text-gray-400 space-y-1 text-sm">
                  {formattedHours.map((hours, index) => (
                    <p key={index}>{hours}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FaPhone className="text-xl text-gold" />
              </motion.div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">
                  Contato
                </h3>
                <div className="space-y-2">
                  <a
                    href="tel:+5521967635340"
                    className="text-gray-400 hover:text-gold transition-colors block"
                  >
                    (21) 96763-5340
                  </a>
                  <a
                    href={SITE_CONFIG.social?.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <FaInstagram className="text-gold" />
                    @masterprimecg
                  </a>
                  <button
                    onClick={() => openWhatsAppForQuote()}
                    className="text-gray-400 hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <FaWhatsapp className="text-whatsapp" />
                    WhatsApp - Orçamento Grátis
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button
                variant="whatsapp-outline"
                size="lg"
                icon={FaWhatsapp}
                iconClassName="text-2xl"
                onClick={() => openWhatsAppForVisit()}
                className="flex-1 font-bold"
                style={{
                  height: "53px",
                  borderRadius: "75px",
                }}
              >
                Agendar Visita
              </Button>
              <Magnetic strength={0.3}>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={FaMapMarkerAlt}
                  href="https://share.google/qAUljzZmA4mBCAknf"
                  className="flex-1"
                  style={{
                    height: "53px",
                    borderRadius: "75px",
                  }}
                >
                  Ver no Mapa
                </Button>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
