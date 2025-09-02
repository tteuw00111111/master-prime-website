// src/components/WhatsAppButton.tsx
"use client";

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { fireAdsConversion } from "@/lib/ads";

const PHONE = "5521967635340"; // 55 + DDD + número, sem +, espaços ou traços
const RAW_MESSAGE = "Olá! Vim do site e quero orçamento para ";
const MESSAGE = encodeURIComponent(RAW_MESSAGE);
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

// Seu ID/label de conversão
const SEND_TO = "AW-17383658790/doflCJ2Z2I8bEKaqluFA";

type Props = {
  ariaLabel?: string;
  className?: string;
  title?: string;
};

export default function WhatsAppButton({
  ariaLabel = "Falar no WhatsApp",
  className = "",
  title = "Fale conosco no WhatsApp",
}: Props) {
  const onClick = () => {
    fireAdsConversion(SEND_TO);
  };

  return (
    <Link
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 bg-green-500 text-white hover:opacity-90 ${className}`}
    >
      <FaWhatsapp aria-hidden className="h-5 w-5" />
    </Link>
  );
}
