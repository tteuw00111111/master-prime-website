import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Link from "next/link";
import AnimatedWave from "@/components/AnimatedWave";
import { FaApple, FaLaptop } from "react-icons/fa";

export default function Notebooks() {
  const notebookBrands = [
    {
      name: "Mac",
      href: "/services/notebooks/mac",
      icon: <FaApple className="w-12 h-12 mx-auto mb-4" />,
    },
    {
      name: "Acer",
      href: "/services/notebooks/acer",
      icon: <FaLaptop className="w-12 h-12 mx-auto mb-4" />,
    },
    {
      name: "Lenovo",
      href: "/services/notebooks/lenovo",
      icon: <FaLaptop className="w-12 h-12 mx-auto mb-4" />,
    },
    {
      name: "Dell",
      href: "/services/notebooks/dell",
      icon: <FaLaptop className="w-12 h-12 mx-auto mb-4" />,
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
              Manutenção de Notebooks
            </h2>
            <p className="text-black/80 text-xl md:text-2xl font-light mt-4 max-w-3xl mx-auto">
              Soluções completas para todas as marcas e modelos.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {notebookBrands.map((brand) => (
              <Link
                href={brand.href}
                key={brand.name}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/5 backdrop-blur-md transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-yellow-400/20 hover:scale-[1.02]"
              >
                <div className="p-8 text-center">
                  {brand.icon}
                  <h3 className="text-2xl font-bold leading-tight mb-3 text-zinc-900">
                    {brand.name}
                  </h3>
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
