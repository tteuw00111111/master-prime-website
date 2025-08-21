import { FaWhatsapp, FaInstagram, FaMapMarkerAlt } from "react-icons/fa";

export default function Contact() {
  return (
    <section
      id="contact"
      className="bg-brand-dark relative text-white min-h-screen flex items-center justify-center overflow-hidden py-24"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-brand-yellow/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold leading-tight">
              Precisando de manutenção?
            </h3>
            <p className="text-gray-300 text-lg mt-4 max-w-3xl mx-auto">
              Estamos prontos para ouvir sobre seu aparelho. Entre em contato
              para um orçamento rápido e sem compromisso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* --- CARD 1: WHATSAPP --- */}
            <div className="bg-gray-800/60 p-8 rounded-xl text-center border border-gray-700 flex flex-col justify-between">
              <div>
                <FaWhatsapp className="text-green-500 text-6xl mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">
                  Fale no WhatsApp
                </h4>
                <p className="text-gray-400 mb-6">
                  Atendimento direto e personalizado para tirar suas dúvidas.
                </p>
              </div>
              <a
                href="https://wa.me/message/TMEA4ZXLGX6WN1"
                className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 transform hover:scale-105"
              >
                <FaWhatsapp className="text-2xl" />
                Iniciar Conversa
              </a>
            </div>

            <div className="bg-gray-800/60 p-8 rounded-xl text-center border border-gray-700 flex flex-col justify-between">
              <div>
                <FaMapMarkerAlt className="text-red-500 text-6xl mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">
                  Nossa Localização
                </h4>
                <p className="text-gray-400 mb-6">
                  Info Shopping Campo Grande <br />
                  Loja 101 - Master Prime
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/uBS1FDAGdyWUKRFy6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 transform hover:scale-105"
              >
                Ver no Mapa
              </a>
            </div>

            {/* --- CARD 3: INSTAGRAM --- */}
            <div className="bg-gray-800/60 p-8 rounded-xl text-center border border-gray-700 flex flex-col justify-between">
              <div>
                <FaInstagram className="text-pink-500 text-6xl mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">
                  Siga no Instagram
                </h4>
                <p className="text-gray-400 mb-6">
                  Acompanhe nossos serviços e novidades em nossa rede social.
                </p>
              </div>
              <a
                href="https://www.instagram.com/masterprimecg?igsh=MXIzODBlcG8zenplMw=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 transform hover:scale-105"
              >
                <FaInstagram className="text-2xl" />
                Visitar Perfil
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
