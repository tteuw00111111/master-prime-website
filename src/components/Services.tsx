import Image from "next/image";
import AnimatedWave from "./AnimatedWave";

const services = [
  {
    imgSrc: "/phone.jpg",
    alt: "Reparo de Smartphones",
    title: "Reparo de<br/>Smartphones",
    description:
      "Troca de telas, baterias e reparos em placas com agilidade e peças de alta qualidade.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
  {
    imgSrc: "/laptop.avif",
    alt: "Manutenção de Notebooks",
    title: "Manutenção de<br/>Notebooks",
    description:
      "Otimização de sistema, remoção de vírus, upgrade de hardware e reparos em geral.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
  {
    imgSrc: "/computer.avif",
    alt: "Manutenção de Computadores",
    title: "Manutenção de<br/>Computadores",
    description:
      "Montagem, upgrades e consertos. Realizamos limpeza completa, diagnóstico de hardware e soluções para garantir a máxima potência da sua máquina.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
  {
    imgSrc: "/console.avif",
    alt: "Conserto de Videogames",
    title: "Conserto de<br/>Videogames",
    description:
      "Reparos em consoles de todas as gerações, manutenção preventiva e troca de componentes.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
  {
    imgSrc: "/impressora.avif",
    alt: "Manutenção de Impressoras",
    title: "Manutenção de<br/>Impressoras",
    description:
      "Diagnóstico e reparo de impressoras a laser e jato de tinta. Realizamos manutenção preventiva e troca de peças para garantir a melhor qualidade de impressão.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
  {
    imgSrc: "/pcgamer.avif",
    alt: "Montagem de PC Gamer",
    title: "Montagem de<br/>PC Gamer",
    description:
      "Montamos o PC Gamer dos seus sonhos. Selecionamos as melhores peças de acordo com seu orçamento e garantimos a máxima performance para seus jogos.",
    link: "https://wa.me/message/TMEA4ZXLGX6WN1",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="bg-[#E2E2E2] relative min-h-screen flex items-center font-roboto py-24 overflow-hidden"
    >
      <AnimatedWave />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-5xl md:text-6xl font-semibold text-black leading-none">
            Nossos Serviços
          </h3>
          <p className="text-black text-2xl md:text-3xl font-light mt-4">
            Oferecemos uma gama completa de reparos e manutenções.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden shadow-2xl transform hover:-translate-y-2 transition-transform duration-300"
            >
              <Image
                src={service.imgSrc}
                alt={service.alt}
                width={400}
                height={600}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="relative h-full flex flex-col justify-end p-6 text-white min-h-[30rem]">
                <h4
                  className="text-3xl font-medium mb-2 leading-tight"
                  dangerouslySetInnerHTML={{ __html: service.title }}
                ></h4>
                <div className="h-24">
                  <p className="text-lg font-light leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {service.description}
                  </p>
                </div>
                <a
                  href={service.link}
                  className="font-semibold text-brand-yellow hover:text-yellow-300 transition-colors text-xl self-start mt-4"
                >
                  Saiba Mais &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
