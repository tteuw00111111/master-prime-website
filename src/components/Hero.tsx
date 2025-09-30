"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import VantaBackground from "./VantaBackground";
import { FiCheckCircle } from "react-icons/fi";

const MobileFallbackBackground = () => (
  <div className="absolute top-0 left-0 w-full h-full bg-gray-950 hero-pattern" />
);

export default function Hero() {
  const isMobile = useIsMobile();

  return (
    <section className="text-white min-h-screen flex flex-col items-center justify-center relative">
      {isMobile ? <MobileFallbackBackground /> : <VantaBackground />}

      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-4">
          <span className="text-brand-yellow">Master Prime</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
          Sua loja de informática em Campo Grande — encontre acessórios, peças e monte seu PC.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a
            href="https://wa.me/5521967635340?text=Olá!%20Vim%20do%20site%20e%20quero%20orçamento%20para%20"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', {
                  send_to: 'AW-17383658790/doflCJ2Z2I8bEKaqluFA'
                });
              }
            }}
            className="btn-gradient hover:opacity-90 text-[#0A0A0A] font-bold py-4 px-10 rounded-full text-xl transition duration-300 transform hover:scale-105"
          >
            Falar no WhatsApp
          </a>
          <a
            href="#services"
            className="border-[3px] border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-[#0A0A0A] font-bold py-4 px-10 rounded-full text-xl transition duration-300"
          >
            Ver Produtos & Opções
          </a>
        </div>
        <div className="flex items-center justify-center mt-6">
          <FiCheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <p className="text-sm text-gray-300">Serviço com Garantia de 90 Dias</p>
        </div>
      </div>
    </section>
  );
}