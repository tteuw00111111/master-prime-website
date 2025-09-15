
import AnimatedSection from "@/components/AnimatedSection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AnimatedWave from "@/components/AnimatedWave";
import { FiCpu, FiHardDrive, FiMonitor } from "react-icons/fi";

interface NotebookPageProps {
  brandName: string;
}

export default function NotebookPage({ brandName }: NotebookPageProps) {
  const services = [
    {
      title: "Reparo de Placa-Mãe",
      description: "Especialistas em reparo de placa-mãe, um dos componentes mais críticos e caros do notebook.",
      icon: <FiCpu className="w-8 h-8 text-yellow-400" />
    },
    {
      title: "Troca de Tela",
      description: "Troca de telas quebradas ou com defeito, com peças de reposição de alta qualidade.",
      icon: <FiMonitor className="w-8 h-8 text-yellow-400" />
    },
    {
      title: "Upgrade de Performance",
      description: "Melhore o desempenho do seu notebook com upgrade de memória RAM, SSD e outros componentes.",
      icon: <FiHardDrive className="w-8 h-8 text-yellow-400" />
    },
  ];

  return (
    <main>
      <Header />
      <section className="relative bg-[#E2E2E2] font-roboto py-24 overflow-hidden">
        <AnimatedWave />
        <div className="container mx-auto px-6 relative z-10">
          <header className="text-center mb-14">
            <h2 className="text-5xl md:text-6xl font-semibold text-black leading-none">
              Serviços de Reparo para Notebooks {brandName}
            </h2>
            <p className="text-black/80 text-xl md:text-2xl font-light mt-4 max-w-3xl mx-auto">
              Oferecemos um serviço completo de reparo para notebooks da marca {brandName}, com diagnóstico preciso, reparo de hardware e software, e garantia de qualidade.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="group relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/5 backdrop-blur-md p-8 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-yellow-400/20 hover:scale-[1.02]">
                <div className="flex items-center gap-4 mb-4">
                  {service.icon}
                  <h3 className="text-2xl font-bold leading-tight text-zinc-900">
                    {service.title}
                  </h3>
                </div>
                <p className="text-zinc-700">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}
