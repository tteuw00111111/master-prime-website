import { FiAward, FiCheckCircle, FiZap } from "react-icons/fi";

const features = [
  {
    title: "Equipe Qualificada",
    description: "Profissionais com experiência de mercado e foco no cliente.",
    icon: <FiAward className="w-7 h-7" />,
  },
  {
    title: "Qualidade Garantida",
    description:
      "Trabalhamos com marcas e peças confiáveis, sempre com garantia de fábrica.",
    icon: <FiCheckCircle className="w-7 h-7" />,
  },
  {
    title: "Atendimento Ágil",
    description:
      "Respostas rápidas e orientação clara para você decidir com segurança.",
    icon: <FiZap className="w-7 h-7" />,
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="about-bg text-white py-16 md:py-0 md:min-h-screen md:flex md:items-center"
    >
      <div className="container mx-auto px-6">
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="md:pr-8">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-transparent bg-clip-text">
                Qualidade e Confiança em Tecnologia
              </h3>

              <div className="w-24 h-1 bg-yellow-400 rounded-full mt-4 mb-6"></div>

              <p className="text-gray-200 mb-6 leading-relaxed">
                Nascemos da paixão por tecnologia e do compromisso com a
                transparência. Há mais de 10 anos, a Master Prime é a sua loja de informática em Campo
                Grande, oferecendo os melhores produtos e componentes com uma
                experiência de compra tranquila e objetiva.
              </p>
              <p className="text-gray-200 leading-relaxed">
                Nossa missão é simples: oferecer as melhores opções de peças e equipamentos, garantindo desempenho, durabilidade e um atendimento focado em ajudar você a fazer a escolha certa.
              </p>
            </div>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start group transition-transform duration-300 ease-in-out hover:-translate-y-1"
                >
                  <div className="flex-shrink-0">
                    <div className="bg-yellow-400 text-gray-900 rounded-lg w-12 h-12 flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-yellow-400/50">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-bold">{feature.title}</h4>
                    <p className="text-gray-300 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
