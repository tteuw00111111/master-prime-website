"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-gray-800 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <a href="#" aria-label="Voltar ao início">
            <Image
              src="/master_prime_logo.png"
              alt="Master Prime Logo"
              width={150}
              height={50}
              className="h-12 w-auto"
            />
          </a>
        </div>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex space-x-8">
          <a
            href="#services"
            className="font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Serviços
          </a>
          <a
            href="#about"
            className="font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Sobre
          </a>
          <a
            href="#contact"
            className="font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Contato
          </a>
        </nav>

        {/* Botão Mobile */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            />
          </svg>
        </button>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-lg px-6 pb-4 space-y-4">
          <a
            href="#services"
            className="block font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Serviços
          </a>
          <a
            href="#about"
            className="block font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Sobre
          </a>
          <a
            href="#contact"
            className="block font-poppins text-[#DEDEDE] hover:text-brand-yellow transition duration-300"
          >
            Contato
          </a>
        </div>
      )}
    </header>
  );
}
