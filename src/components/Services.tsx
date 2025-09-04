"use client";

import Image from "next/image";
import AnimatedWave from "./AnimatedWave";
import Link from "next/link";
import {
  FiSmartphone,
  FiCpu,
  FiPackage,
  FiPrinter,
  FiMonitor,
  FiHardDrive,
  FiHeadphones,
  FiArrowUpRight,
} from "react-icons/fi";

import { FaGamepad } from "react-icons/fa";

const PRODUCTS: Array<{
  imgSrc: string;
  alt: string;
  title: string;
  bullets: string[];
  icon: React.ReactNode;
  cta?: { label: string; href: string };
}> = [
  {
    imgSrc: "/phone.jpg",
    alt: "Acessórios para celulares",
    title: "Acessórios p/ Celular",
    bullets: ["Capas e películas", "Cabos e carregadores", "Baterias e telas"],
    icon: <FiSmartphone className="w-5 h-5" />,
    cta: { label: "Consultar", href: "https://wa.me/message/TMEA4ZXLGX6WN1" },
  },
  {
    imgSrc: "/laptop.avif",
    alt: "Kits de upgrade para notebook",
    title: "Kit Upgrade p/ Notebook",
    bullets: ["SSD e memória", "Teclados e telas", "Fontes e acessórios"],
    icon: <FiPackage className="w-5 h-5" />,
    cta: {
      label: "Quero meu kit",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
  {
    imgSrc: "/computer.avif",
    alt: "Peças para computador",
    title: "Peças p/ PC",
    bullets: [
      "Placa-mãe, CPU, RAM",
      "SSD, fontes, coolers",
      "Gabinetes e LEDs",
    ],
    icon: <FiCpu className="w-5 h-5" />,
    cta: { label: "Ver opções", href: "https://wa.me/message/TMEA4ZXLGX6WN1" },
  },
  {
    imgSrc: "/pcgamer.avif",
    alt: "Montagem de PC Gamer sob medida",
    title: "PC Gamer — Projeto",
    bullets: [
      "Montagem sob medida",
      "Cabe no seu orçamento",
      "Foco no jogo que você curte",
    ],
    icon: <FiMonitor className="w-5 h-5" />,
    cta: {
      label: "Planejar meu PC",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
  {
    imgSrc: "/impressora.avif",
    alt: "Cartuchos e toners",
    title: "Cartuchos & Toners",
    bullets: [
      "Jato de tinta e laser",
      "Rolos e correias",
      "Originais e compatíveis",
    ],
    icon: <FiPrinter className="w-5 h-5" />,
    cta: {
      label: "Checar modelos",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
  {
    imgSrc: "/console.avif",
    alt: "Acessórios para consoles",
    title: "Acessórios p/ Console",
    bullets: ["Controles e cabos", "Headsets e suportes", "Peças selecionadas"],
    icon: <FaGamepad className="w-5 h-5" />,
    cta: {
      label: "Perguntar no WhatsApp",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
  {
    imgSrc: "/computer.avif",
    alt: "Periféricos",
    title: "Periféricos",
    bullets: ["Teclados e mouses", "Headsets e mousepads", "Monitores e hubs"],
    icon: <FiHeadphones className="w-5 h-5" />,
    cta: {
      label: "Ver disponibilidade",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
  {
    imgSrc: "/laptop.avif",
    alt: "Armazenamento e memória",
    title: "Armazenamento & Memória",
    bullets: ["SSDs SATA/NVMe", "Memórias DDR4/DDR5", "Cartões e adaptadores"],
    icon: <FiHardDrive className="w-5 h-5" />,
    cta: {
      label: "Conferir opções",
      href: "https://wa.me/message/TMEA4ZXLGX6WN1",
    },
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="relative bg-[#E2E2E2] font-roboto py-24 overflow-hidden"
    >
      <AnimatedWave />

      <div className="container mx-auto px-6 relative z-10">
        <header className="text-center mb-14">
          <h2 className="text-5xl md:text-6xl font-semibold text-black leading-none">
            Produtos & Kits
          </h2>
          <p className="text-black/80 text-xl md:text-2xl font-light mt-4 max-w-3xl mx-auto">
            Tudo que você precisa para o dia a dia — simples, direto e com boas
            opções.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {PRODUCTS.map((p, i) => (
            <li
              key={i}
              className="group relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/5 backdrop-blur-md transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-yellow-400/20 hover:scale-[1.02]"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={p.imgSrc}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  priority={i < 4}
                />
              </div>

              <div className="flex-grow flex flex-col p-6 text-zinc-900">
                <h3 className="text-2xl font-bold leading-tight mb-3 flex items-center gap-2">
                  <span className="text-yellow-400">{p.icon}</span>
                  <span>{p.title}</span>
                </h3>

                <ul className="space-y-1 text-sm text-zinc-700 min-h-[4.5rem]">
                  {p.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {p.cta && (
                  <div className="pt-4 mt-auto">
                    <Link
                      href={p.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 text-black font-bold px-5 py-2 transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      {p.cta.label}
                      <FiArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Linha PC Gamer",
              desc: "Projetos por faixa de preço e jogo. Componentes de confiança.",
            },
            {
              title: "Kits de Upgrade",
              desc: "SSD e memória na medida certa. A gente orienta a escolha.",
            },
            {
              title: "Suprimentos p/ Impressoras",
              desc: "Cartuchos, toners e peças — originais e compatíveis.",
            },
          ].map((d, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-6 border border-black/10 bg-white/50 backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl"
            >
              <h4 className="text-xl font-semibold text-black mb-2">
                {d.title}
              </h4>
              <p className="text-black/80">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
