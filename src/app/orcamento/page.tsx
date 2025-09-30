"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import "../inicio/animations.css";

const OrcamentoHeader = () => (
  <header className="absolute top-0 left-0 w-full z-50 py-4">
    <div className="container mx-auto px-6 flex justify-center items-center">
      <Image
        src="/master_prime_logo.png"
        alt="Master Prime Logo"
        width={180}
        height={60}
        className="h-14 w-auto"
      />
    </div>
  </header>
);

const OrcamentoHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden animated-gradient">
      <div className="relative z-10 container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-focus-in">
          Orçamento Rápido e Gratuito
        </h1>
        <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto mb-10">
          Atendemos com rapidez e garantia de 90 dias em Campo Grande, RJ.
        </p>
        <div className="flex flex-col items-center gap-4">
          <a
            href="https://wa.me/message/TMEA4ZXLGX6WN1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', {
                  send_to: 'AW-17383658790/XfceCMeR4KQbEKaqluFA'
                });
              }
            }}
            className="inline-flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-4 px-10 rounded-full text-xl transform hover:scale-105 transition-transform duration-300 shadow-lg w-full sm:w-auto animate-pulse-glow"
          >
            <FaWhatsapp /> Orçamento Grátis
          </a>
          <Link
            href="/"
            className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
          >
            Ver Página Inicial
          </Link>
        </div>
      </div>
    </section>
  );
};

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

export default function OrcamentoPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Tempo de loading reduzido

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className="bg-white">
      <OrcamentoHeader />
      <OrcamentoHero />
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}