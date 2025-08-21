import { FaWhatsapp, FaInstagram } from "react-icons/fa";

export default function Contact() {
  return (
    <section
      id="contact"
      className="bg-brand-dark relative text-white min-h-screen flex items-center justify-center overflow-hidden py-24"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-brand-yellow/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center md:text-left">
            <h3 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Tem um projeto em mente?
            </h3>
            <p className="text-gray-300 text-lg mb-8">
              Estamos prontos para ouvir sobre seu aparelho. Entre em contato
              para um orçamento rápido e sem compromisso. Nossa equipe
              responderá o mais breve possível.
            </p>
            <div className="flex justify-center md:justify-start space-x-6">
              <a
                href="https://www.instagram.com/masterprimecg?igsh=MXIzODBlcG8zenplMw=="
                aria-label="Instagram"
                className="text-gray-400 hover:text-white transition-transform duration-300 hover:scale-110"
              >
                <FaInstagram className="text-4xl" />
              </a>
            </div>
          </div>

          <div className="bg-gray-800/60 p-8 rounded-xl text-center border border-gray-700">
            <FaWhatsapp className="text-green-500 text-6xl mx-auto mb-4" />
            <h4 className="text-2xl font-bold text-white mb-2">
              Fale Conosco no WhatsApp
            </h4>
            <p className="text-gray-400 mb-6">
              Atendimento direto e personalizado para tirar todas as suas
              dúvidas.
            </p>
            <a
              href="https://wa.me/message/TMEA4ZXLGX6WN1"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 transform hover:scale-105"
            >
              <FaWhatsapp className="text-2xl" />
              Iniciar Conversa
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
