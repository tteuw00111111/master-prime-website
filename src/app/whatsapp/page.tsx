"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/navigation";

const PHONE = "5521967635340";
const MESSAGE = encodeURIComponent(
  "Olá, vim pelo site. Meu problema é..."
);
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export default function WhatsAppPage() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    if (countdown === 0) {
      window.location.href = WA_URL;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="bg-brand-dark text-gray-200 antialiased">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        <FaWhatsapp className="mb-6 text-7xl text-green-500" />

        <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
          Redirecionando para o WhatsApp
        </h1>
        <p className="mb-8 max-w-md text-lg text-gray-400">
          Você será redirecionado em{" "}
          <span className="font-bold text-white">{countdown}</span> segundos...
        </p>

        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex transform items-center gap-3 rounded-full bg-green-500 px-8 py-4 font-bold text-white shadow-lg shadow-green-500/20 transition-transform duration-300 hover:scale-105 hover:bg-green-600"
        >
          <FaWhatsapp className="h-6 w-6" />
          Abrir o WhatsApp Agora
        </a>
      </main>
    </div>
  );
}