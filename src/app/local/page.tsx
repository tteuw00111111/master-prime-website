export default function LocalPage() {
  return (
    <div className="bg-brand-dark text-gray-200 antialiased">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 text-white">
          Nossa Localização
        </h1>
        <p className="text-lg text-brand-yellow mb-8">Master Prime</p>

        <p className="mb-6 text-lg text-gray-300">
          Estamos localizados no Info Shopping Campo Grande – Loja 101.
          <br />
          <span className="text-gray-400">
            Avenida Cesário de Melo, 2869 – Campo Grande, Rio de Janeiro - RJ
          </span>
        </p>

        <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.191663459006!2d-43.562405922426!3d-22.906300437857958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9be100505ac04f%3A0x893f6790c6094c6e!2sInfo%20Shopping%20Campo%20Grande!5e0!3m2!1sen!2sbr!4v1756833305368!5m2!1sen!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Master Prime no Google Maps"
          />
        </div>

        <a
          href="https://maps.app.goo.gl/TpVbvdMHs1awZcRi8"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient hover:opacity-90 text-[#0A0A0A] font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 inline-block"
        >
          Ver Rota no Google Maps
        </a>
      </main>
    </div>
  );
}
