// src/app/whatsapp/page.tsx
import { FaWhatsapp } from "react-icons/fa";

// The business logic remains the same
const PHONE = "5521967635340";
const MESSAGE = encodeURIComponent(
  "Olá! Gostaria de um orçamento." // Slightly updated message
);
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export default function WhatsAppPage() {
  return (
    // Applied the dark theme to the entire page
    <div className="bg-brand-dark text-gray-200 antialiased">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        {/* Made the WhatsApp icon a large, primary visual element */}
        <FaWhatsapp className="mb-6 text-7xl text-green-500" />

        {/* Improved typography to match the site's style */}
        <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
          Fale Conosco
        </h1>
        <p className="mb-8 max-w-md text-lg text-gray-400">
          Clique no botão abaixo para ser redirecionado e iniciar sua conversa
          diretamente no WhatsApp.
        </p>

        {/* Updated the button to be more modern and consistent with the site's theme */}
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex transform items-center gap-3 rounded-full bg-green-500 px-8 py-4 font-bold text-white shadow-lg shadow-green-500/20 transition-transform duration-300 hover:scale-105 hover:bg-green-600"
        >
          <FaWhatsapp className="h-6 w-6" />
          Iniciar Conversa no WhatsApp
        </a>
      </main>
    </div>
  );
}
