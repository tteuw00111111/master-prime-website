import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { openWhatsAppForQuote } from "@/utils/whatsapp";
import {
  heroTextContainer,
  heroTextItem,
} from "@/utils/animations";
import heroPhoneImage from "@/assets/images/asset_phone_main_page.png";
import DotGrid from "@/components/ui/DotGrid";
import { Magnetic } from "../ui/Magnetic";

export const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Interactive Dot Grid Background */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#0a0a0a"
          activeColor="#FFD700"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          className="w-full h-full"
        />
      </div>

      <section
        id="hero"
        className="relative z-10 w-full min-h-screen flex items-center justify-center pointer-events-none"
      >
        {/* Header with Logo */}
        <Header />

        {/* Large Phone Asset with Yellow Circle Background - Right Side */}
        <motion.div
          className="hidden md:block absolute z-10 pointer-events-auto"
          style={{
            width: "clamp(65vh, 92vh, 92vh)",
            height: "auto",
            top: "5vh",
            right: "max(-48vh, calc(-48vh + (100vw - 1280px) * 0.10))",
          }}
          whileHover={{
            scale: 1.05,
            rotate: -2,
            x: -20,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <motion.div
            className="relative"
            whileHover={{
              filter: "drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))",
            }}
            transition={{
              duration: 0.3,
            }}
          >
            <img
              src={heroPhoneImage}
              alt="Smartphone com interface Master Prime"
              className="w-full h-auto"
              loading="eager"
              fetchPriority="high"
            />
          </motion.div>
        </motion.div>

        {/* Text Content - Centered in Screen */}
        <div className="relative z-20 w-full flex items-center justify-center px-4">
          <motion.div
            className="text-center max-w-3xl pointer-events-auto"
            variants={heroTextContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Main Headline - 2 Lines, White then Yellow, No Word Breaks */}
            <motion.h1
              variants={heroTextItem}
              className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-britanica font-black leading-tight mb-3 sm:mb-4 md:mb-6"
            >
              <span className="text-white block mb-0 whitespace-nowrap">
                Peças e Componentes para seu Dispositivo
              </span>
              <span className="text-gold block whitespace-nowrap">
                Telas, Baterias e Acessórios!
              </span>
            </motion.h1>

            {/* Subtitle - Location */}
            <motion.p
              variants={heroTextItem}
              className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-white mb-6 sm:mb-8 md:mb-10 lg:mb-14 font-britanica font-normal"
            >
              Para Todo Rio de Janeiro
            </motion.p>

            {/* CTA Button - WhatsApp Outline with Green Text and Icon */}
            <motion.div
              variants={heroTextItem}
              className="flex justify-center mb-8 sm:mb-12 md:mb-[60px]"
            >
              <Magnetic>
                <Button
                  variant="whatsapp-outline"
                  size="lg"
                  icon={FaWhatsapp}
                  iconClassName="text-2xl sm:text-3xl"
                  onClick={() => openWhatsAppForQuote()}
                  className="font-bold text-sm sm:text-base"
                  style={{
                    width: "clamp(200px, 251px, 251px)",
                    height: "clamp(44px, 53px, 53px)",
                    borderRadius: "75px",
                    padding: "0",
                  }}
                >
                  Orçamento Grátis
                </Button>
              </Magnetic>
            </motion.div>

            {/* Trust Badges - Below Button with 60px gap */}
            <TrustBadges />
          </motion.div>
        </div>
      </section>
    </div>
  );
};