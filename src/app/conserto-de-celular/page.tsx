"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AnimatedWave from "@/components/AnimatedWave";
import { FiSmartphone, FiBattery, FiMonitor } from "react-icons/fi";

const handleWhatsAppClick = () => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-17383658790/XfceCMeR4KQbEKaqluFA",
    });
  }
};

export default function ConsertoDecelular() {
  const services = [
    {
      title: "Troca de Tela",
      description:
        "Substituição de telas danificadas com componentes de qualidade, mantendo a funcionalidade touch e brilho original.",
      icon: <FiMonitor className="w-8 h-8 text-yellow-400" />,
    },
    {
      title: "Troca de Bateria",
      description:
        "Substituição de baterias com componentes certificados para restaurar a autonomia do seu aparelho.",
      icon: <FiBattery className="w-8 h-8 text-yellow-400" />,
    },
    {
      title: "Diagnóstico Técnico",
      description:
        "Análise completa do dispositivo para identificar problemas de hardware e software com precisão.",
      icon: <FiSmartphone className="w-8 h-8 text-yellow-400" />,
    },
  ];

  return (
    <main>
      <Header />
      <section className="relative bg-[#E2E2E2] font-roboto py-24 overflow-hidden">
        <AnimatedWave />
        <div className="container mx-auto px-6 relative z-10">
          <header className="text-center mb-14">
            <h1 className="text-5xl md:text-6xl font-semibold text-black leading-none">
              Serviços para Celulares
            </h1>
            <p className="text-black/80 text-xl md:text-2xl font-light mt-4 max-w-3xl mx-auto">
              Oferecemos serviços de diagnóstico e manutenção para diversos
              modelos de celulares com qualidade e garantia.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
              <a
                href="https://wa.me/5521967635340?text=Olá!%20Vim%20do%20site%20e%20quero%20orçamento%20para%20celular"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-10 rounded-full text-xl transition duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 animate-pulse hover:animate-none"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Orçamento GRÁTIS via WhatsApp
              </a>
              <a
                href="tel:+5521967635340"
                onClick={() => {
                  if (typeof window !== "undefined" && typeof window.gtag === "function") {
                    window.gtag("event", "conversion", {
                      send_to: "AW-17383658790/XfceCMeR4KQbEKaqluFA",
                    });
                  }
                }}
                className="border-[3px] border-yellow-400 text-zinc-900 hover:bg-yellow-400 hover:text-black font-bold py-4 px-10 rounded-full text-xl transition duration-300 shadow-lg flex items-center gap-3 hover:scale-105 transform"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                Ligar Agora
              </a>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/5 backdrop-blur-md p-8 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-yellow-400/20 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4 mb-4">
                  {service.icon}
                  <h2 className="text-2xl font-bold leading-tight text-zinc-900">
                    {service.title}
                  </h2>
                </div>
                <p className="text-zinc-700">{service.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">
              Nossos Diferenciais
            </h3>
            <ul className="space-y-3 text-zinc-800">
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Diagnóstico preciso e transparente antes de qualquer intervenção</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Técnicos qualificados com experiência em múltiplas marcas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Componentes de qualidade com garantia de serviço</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Orçamento sem compromisso e atendimento personalizado</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}
