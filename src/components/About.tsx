import { FiAward, FiCheckCircle, FiZap } from "react-icons/fi";

const features = [
  {
    title: "Experiência Comprovada",
    description: "Técnicos certificados com mais de uma década de mercado.",
    icon: <FiAward className="w-7 h-7" />,
  },
  {
    title: "Qualidade Garantida",
    description:
      "Utilizamos apenas peças de alta qualidade com garantia total no serviço.",
    icon: <FiCheckCircle className="w-7 h-7" />,
  },
  {
    title: "Agilidade Total",
    description:
      "Diagnóstico rápido e orçamentos em até 24 horas para a maioria dos casos.",
    icon: <FiZap className="w-7 h-7" />,
  },
];

export default function About() {
  return (
    <section id="about" className="about-bg text-white py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="md:pr-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Mais que Reparos, Construímos Confiança
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Nascemos da paixão por tecnologia e da vontade de oferecer um
              serviço justo e transparente. Há mais de 10 anos, a Master Prime é
              a solução para quem busca não apenas um conserto, mas uma
              experiência de atendimento focada na tranquilidade e satisfação do
              cliente.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Nossa missão é simples: devolver seu aparelho em perfeito estado,
              com a agilidade que você precisa e a qualidade que você merece.
            </p>
          </div>
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="bg-yellow-400 text-gray-900 rounded-lg w-12 h-12 flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-bold">{feature.title}</h4>
                  <p className="text-gray-400 mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
