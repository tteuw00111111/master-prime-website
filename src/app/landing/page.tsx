import AnimatedSection from '@/components/AnimatedSection';
import Header from '@/components/Header';
import LandingHero from '@/components/LandingHero';
import Services from '@/components/Services';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

export default function LandingPage() {

  return (
    <main>
      <Header />
      <LandingHero />
      <AnimatedSection>
        <Services />
      </AnimatedSection>
      {/* <AnimatedSection>
        <About />
      </AnimatedSection> */}
      <AnimatedSection>
        <Contact />
      </AnimatedSection>
      <Footer />
      <>
        <WhatsAppFloat />
      </>
    </main>
  );
}
