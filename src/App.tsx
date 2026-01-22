import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Testimonials } from '@/components/sections/Testimonials'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/layout/Footer'
import Waves from '@/components/ui/Waves'

function App() {
  return (
    <div className="App bg-black text-white overflow-x-hidden min-h-screen">
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
