"use client";

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const PHONE = "5521967635340";
const MESSAGE = encodeURIComponent("Olá! Vim do site e quero orçamento.");
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export default function WhatsAppFloat() {
  return (
    <Link
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir WhatsApp"
      title="Fale conosco no WhatsApp"
      className="
        fixed bottom-5 right-5
        grid place-items-center
        h-14 w-14 rounded-full
        bg-green-500 text-white
        shadow-lg
        z-[9999] hover:opacity-90
      "
    >
      <FaWhatsapp className="h-7 w-7" aria-hidden />
    </Link>
  );
}
