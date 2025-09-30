'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Services from '@/components/Services';
import AnimatedSection from '@/components/AnimatedSection';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-black flex flex-col items-center z-50 px-4">
    <div className="flex items-center justify-center pt-12 sm:pt-16 mb-8">
      <Image
        src="/master_prime_logo.png"
        alt="Master Prime Logo"
        width={160}
        height={53}
        className="h-10 sm:h-14 w-auto"
      />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm w-full">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full"></div>
        </div>
      </div>
      <div className="text-center space-y-2">
        <div className="text-yellow-400 font-bold text-lg sm:text-xl">
          Carregando...
        </div>
        <p className="text-white text-sm sm:text-base leading-relaxed">
          Aguarde, estamos preparando a página para você
        </p>
      </div>
    </div>
  </div>
);

export default function ServicosPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

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