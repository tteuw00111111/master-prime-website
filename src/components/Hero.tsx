"use client";

import VantaBackground from "./VantaBackground"; // Import the Vanta component

export default function Hero() {
  return (
    <section className="text-white min-h-screen flex flex-col items-center justify-center relative">
      <VantaBackground />

      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-6xl md:text-8xl font-extrabold leading-tight mb-4">
          Assistência Técnica <br /> Especializada
        </h2>
        <p className="text-xl md:text-3xl text-gray-300 max-w-4xl mx-auto mb-8">
          Soluções rápidas e confiáveis para todos os seus aparelhos
          eletrônicos. Qualidade e confiança que você pode ver.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a
            href="#contact"
            className="btn-gradient hover:opacity-90 text-[#0A0A0A] font-bold py-4 px-10 rounded-full text-xl transition duration-300 transform hover:scale-105"
          >
            Solicite um Orçamento
          </a>
          <a
            href="#services"
            className="border-[3px] border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-[#0A0A0A] font-bold py-4 px-10 rounded-full text-xl transition duration-300"
          >
            Conheça os Serviços
          </a>
        </div>
      </div>
    </section>
  );
}
