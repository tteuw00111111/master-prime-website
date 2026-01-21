import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Testimonials } from '@/components/sections/Testimonials'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/layout/Footer'
import Waves from '@/components/ui/Waves'

function App() {
  const [countdown, setCountdown] = useState(10)
  const [showTimer, setShowTimer] = useState(true)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setShowTimer(false)
    }
  }, [countdown])

  return (
    <div className="App bg-black text-white overflow-x-hidden min-h-screen">
      {/* 10 Second Countdown Timer Overlay */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[150px] md:text-[200px] font-britanica font-black text-gold"
              >
                {countdown}
              </motion.div>
              <p className="text-white/60 text-lg md:text-xl mt-4">
                Carregando Master Prime...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <main>
        <Hero />
        
        {/* Shared Background for Services and HowItWorks */}
        <div className="relative bg-black">
          <div className="absolute inset-0 pointer-events-none z-0">
            <Waves
              lineColor="rgba(255, 255, 255, 0.05)"
              backgroundColor="transparent"
              waveSpeedX={0.02}
              waveSpeedY={0.01}
              waveAmpX={40}
              waveAmpY={20}
              friction={0.9}
              tension={0.01}
              maxCursorMove={120}
              xGap={12}
              yGap={36}
            />
          </div>
          <div className="relative z-10">
            <Services />
            <HowItWorks />
          </div>
        </div>

        <Testimonials />
        <Location />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}

export default App
