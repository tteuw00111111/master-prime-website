import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Link from "next/link";
import AnimatedWave from "@/components/AnimatedWave";
import { FaLaptop, FaMobileAlt, FaDesktop, FaTabletAlt } from "react-icons/fa";

export default function Products() {
  const productCategories = [
    {
      name: "Notebooks",
      href: "/services/notebooks",
      icon: <FaLaptop className="w-12 h-12 mx-auto mb-4" />,
      description: "Conserto e manutenção de notebooks de todas as marcas"
    },
    {
      name: "Celulares",
      href: "/conserto-de-celular",
      icon: <FaMobileAlt className="w-12 h-12 mx-auto mb-4" />,
      description: "Reparo de smartphones e dispositivos móveis"
    },
    {
      name: "Desktops",
      href: "/servicos",
      icon: <FaDesktop className="w-12 h-12 mx-auto mb-4" />,
      description: "Manutenção e upgrade de computadores desktop"
    },
    {
      name: "Tablets",
      href: "/servicos",
      icon: <FaTabletAlt className="w-12 h-12 mx-auto mb-4" />,
      description: "Conserto de tablets e dispositivos touch"
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
              Nossos Produtos
            </h1>
            <p className="text-black/80 text-xl md:text-2xl font-light mt-4 max-w-3xl mx-auto">
              Encontre o serviço ideal para seu dispositivo. Atendemos todas as marcas e modelos.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productCategories.map((category) => (
              <Link
                href={category.href}
                key={category.name}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/5 backdrop-blur-md transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-yellow-400/20 hover:scale-[1.02]"
              >
                <div className="p-8 text-center">
                  {category.icon}
                  <h3 className="text-2xl font-bold leading-tight mb-3 text-zinc-900">
                    {category.name}
                  </h3>
                  <p className="text-zinc-700 text-sm leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </main>
  );
}