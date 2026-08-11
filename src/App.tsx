import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Testimonials } from '@/components/sections/Testimonials'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/layout/Footer'
import { InnerHeader } from '@/components/layout/InnerHeader'
import { ServicePage } from '@/components/pages/ServicePage'
import { ServicesHub } from '@/components/pages/ServicesHub'
import { JsonLd } from '@/components/seo/JsonLd'
import Waves from '@/components/ui/Waves'
import { getPageSchemas, getServicePage, normalizePath } from '@/utils/seo'

interface AppProps {
  pathname?: string
}

const HomePage = () => {
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

const NotFoundPage = () => (
  <div className="min-h-screen bg-black text-white">
    <InnerHeader />
    <main className="container-custom py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-gold">Erro 404</p>
      <h1 className="mt-4 text-4xl font-black md:text-6xl">Página não encontrada</h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-400">O endereço solicitado não corresponde a uma página publicada da Master Prime.</p>
      <a href="/servicos" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-6 py-3 font-bold text-black">Ver serviços</a>
    </main>
    <Footer />
  </div>
)

function App({ pathname }: AppProps) {
  const path = normalizePath(pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/'))
  const servicePage = getServicePage(path)

  let pageContent: React.ReactNode
  if (path === '/') pageContent = <HomePage />
  else if (path === '/servicos') pageContent = <ServicesHub />
  else if (servicePage) pageContent = <ServicePage page={servicePage} />
  else pageContent = <NotFoundPage />

  return (
    <>
      <JsonLd schemas={getPageSchemas(path)} />
      {pageContent}
    </>
  )
}

export default App
