// src/app/whatsapp/page.tsx
import { FaWhatsapp } from "react-icons/fa";

const PHONE = "5521967635340";
const MESSAGE = encodeURIComponent(
  "Olá! Gostaria de um orçamento para meu celular."
);
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export default function WhatsAppPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-6 text-2xl font-bold">Fale Conosco</h1>
      <p className="mb-8 text-neutral-600">
        Clique no botão abaixo para iniciar sua conversa pelo WhatsApp.
      </p>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
      >
        <FaWhatsapp className="h-6 w-6" />
        Iniciar Conversa no WhatsApp
      </a>
    </main>
  );
}
