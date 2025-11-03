"use client";
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

export default function OrcamentoPage() {

  return (
    <main className="bg-white">
      <OrcamentoHeader />
      <OrcamentoHero />
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}