import { useMemo, useCallback, memo } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getWhatsAppServiceUrl, trackWhatsAppService } from '@/utils/whatsapp'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

// Images
import pcGamerImage from '@/assets/images/pc_gamer.webp'
import ps5Image from '@/assets/images/ps5_sem_bg.webp'
import xboxImage from '@/assets/images/xbox_series_x.webp'
import notebookImage from '@/assets/images/note_sem_bg.webp'
import iphoneImage from '@/assets/images/iphone_sem_bg.webp'

// Extract services data to module level (outside component)
const SERVICES_DATA = [
  // Top Row
  {
    id: 1,
    titlePart1: 'Computadores e',
    titlePart2: 'PC Gamer',
    description: 'Manutenção de computador, diagnóstico de hardware, formatação, limpeza, instalação de SSD e upgrades.',
    image: pcGamerImage,
    imageWidth: 732,
    imageHeight: 732,
    color: 'rgba(82, 39, 255, 0.4)',
    href: '/conserto-de-computador-campo-grande-rj',
  },
  {
    id: 2,
    titlePart1: 'Videogames e',
    titlePart2: 'Consoles',
    description: 'Conserto de videogame, limpeza e diagnóstico de console que não liga ou liga e desliga.',
    image: ps5Image,
    imageWidth: 463,
    imageHeight: 559,
    color: 'rgba(0, 100, 255, 0.3)',
    href: '/conserto-de-videogame',
  },
  {
    id: 3,
    titlePart1: 'Manutenção de',
    titlePart2: 'Celulares',
    description: 'Troca de tela e bateria, conector de carga, reparo de placa, desoxidação, sistema e diagnóstico.',
    image: iphoneImage,
    imageWidth: 557,
    imageHeight: 714,
    color: 'rgba(255, 215, 0, 0.2)',
    href: '/conserto-de-celular-campo-grande-rj',
  },
  // Bottom Row
  {
    id: 4,
    titlePart1: 'Controles com',
    titlePart2: 'Drift',
    description: 'Conserto de controle, correção de drift, manutenção e instalação de analógicos Hall Effect.',
    image: xboxImage,
    imageWidth: 500,
    imageHeight: 500,
    color: 'rgba(16, 124, 16, 0.3)',
    href: '/conserto-de-controle',
  },
  {
    id: 5,
    titlePart1: 'Manutenção de',
    titlePart2: 'Notebooks',
    description: 'Dobradiça, tela, teclado, bateria, upgrade para SSD, placa-mãe, formatação, limpeza e diagnóstico.',
    image: notebookImage,
    imageWidth: 1600,
    imageHeight: 1200,
    color: 'rgba(255, 50, 50, 0.3)',
    href: '/conserto-de-notebook-campo-grande-rj',
  },
  {
    id: 6,
    titlePart1: 'Upgrade de',
    titlePart2: 'PC Gamer',
    description: 'Avaliação de compatibilidade para SSD, memória e upgrades de PC gamer conforme a configuração e o objetivo.',
    image: pcGamerImage,
    imageWidth: 732,
    imageHeight: 732,
    color: 'rgba(0, 255, 150, 0.2)',
    href: '/upgrade-de-pc-gamer',
  },
] as const;

type ServiceType = typeof SERVICES_DATA[number];

const ServiceCard = memo(({ service }: { service: ServiceType }) => {
  // Memoize gradient style
  const gradientStyle = useMemo(() => ({
    background: `radial-gradient(circle at 50% 50%, ${service.color}, transparent 70%)`
  }), [service.color]);

  // Memoize service name
  const serviceName = useMemo(
    () => `${service.titlePart1} ${service.titlePart2}`,
    [service.titlePart1, service.titlePart2]
  );

  const whatsAppUrl = useMemo(() => getWhatsAppServiceUrl(serviceName), [serviceName]);

  const handleWhatsAppClick = useCallback(() => {
    trackWhatsAppService(serviceName);
  }, [serviceName]);
  return (
    <CardContainer className="inter-var w-full h-full">
      <CardBody className="bg-[#050505] relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] border-white/5 w-full h-auto rounded-[30px] p-6 border transition-colors duration-300">

        {/* Background Gradient */}
        <div
          className="absolute inset-0 opacity-20 rounded-[30px] pointer-events-none"
          style={gradientStyle}
        />

        <div className="flex flex-col h-full relative z-10">
          <CardItem
            as="h3"
            translateZ="50"
            className="text-3xl md:text-4xl font-britanica text-white mb-2 leading-[0.9] flex flex-col"
          >
            <span className="font-black">{service.titlePart1}</span>
            <span className="font-normal">{service.titlePart2}</span>
          </CardItem>
          
          <CardItem
            as="p"
            translateZ="60"
            className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed"
          >
            {service.description}
          </CardItem>

          <a href={service.href} className="mb-4 inline-flex text-sm font-bold text-gold hover:underline">
            Conhecer o serviço →
          </a>
          
          {/* Image Pop-out */}
          <CardItem translateZ="100" className="w-full mt-auto mb-6 flex justify-center items-center">
             <div className="relative w-full h-[200px] flex items-center justify-center">
                <img
                  src={service.image}
                  alt={`${service.titlePart1} ${service.titlePart2}`}
                  width={service.imageWidth}
                  height={service.imageHeight}
                  className="h-full w-auto object-contain drop-shadow-2xl group-hover/card:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
             </div>
          </CardItem>

          <CardItem
            translateZ={20}
            className="mt-auto"
          >
            <Button
              variant="whatsapp-outline"
              size="sm"
              icon={FaWhatsapp}
              href={whatsAppUrl}
              onClick={handleWhatsAppClick}
              className="rounded-full !px-6 border-whatsapp text-whatsapp hover:bg-whatsapp hover:text-white w-full md:w-auto"
            >
              Solicitar Atendimento
            </Button>
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
});

ServiceCard.displayName = 'ServiceCard';

export const Services = () => {

  return (
    <section id="services" className="py-20 md:py-32 relative overflow-hidden">
      <div className="container-custom relative z-10">
        <div className="mb-8 md:mb-12">
          <SectionHeading
            title="Nossos Serviços"
            subtitle="Assistência técnica para celular, notebook, computador, PC gamer, videogame e controle"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {SERVICES_DATA.map((service) => (
            <div key={service.id} className="w-full md:w-[calc(50%-1.25rem)] lg:w-[calc(33.33%-1.25rem)] min-w-[300px] max-w-[400px]">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>

        {/* Saiba Mais Button */}
        <div className="flex justify-center" style={{ marginTop: '60px' }}>
          <a href="/servicos" aria-label="Ver todos os serviços da Master Prime">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="span"
              className="bg-black text-[#FFD700] flex items-center space-x-2 px-8 py-3 font-semibold text-lg hover:text-[#FFED4E] transition-colors"
            >
              <span>Ver Todos os Serviços</span>
            </HoverBorderGradient>
          </a>
        </div>
      </div>
    </section>
  )
}
