import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Services from '@/components/Services';
import AnimatedSection from '@/components/AnimatedSection';
import WhatsAppFloat from '@/components/WhatsAppFloat';

export default function ServicosPage() {

  return (
    <main className="bg-black">
      <Header />
      <div className="text-center pt-28 pb-16 bg-black">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white animate-text-focus-in">
          Nossos <span className="text-brand-yellow">Serviços</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
          De peças a acessórios, temos a solução completa para seus dispositivos. Qualidade e confiança em cada produto.
        </p>
      </div>
      <AnimatedSection>
        <Services />
      </AnimatedSection>
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}