import { useMemo, useCallback, memo } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { openWhatsAppForService } from '@/utils/whatsapp'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

// Images
import pcGamerImage from '@/assets/images/pc_gamer.webp'
import ps5Image from '@/assets/images/ps5_sem_bg.webp'
import xboxImage from '@/assets/images/xbox_series_x.webp'
import notebookImage from '@/assets/images/note_sem_bg.webp'
import iphoneImage from '@/assets/images/iphone_sem_bg.webp'
import celularesImage from '@/assets/images/celulares.webp'

// Extract services data to module level (outside component)
const SERVICES_DATA = [
  // Top Row
  {
    id: 1,
    titlePart1: 'PC Gamer',
    titlePart2: 'Customizado',
    description: 'Peças e componentes para montagem de setups de alta performance. Placas, memórias e mais.',
    image: pcGamerImage,
    color: 'rgba(82, 39, 255, 0.4)',
  },
  {
    id: 2,
    titlePart1: 'Peças para',
    titlePart2: 'Consoles',
    description: 'Componentes e acessórios para PlayStation, Xbox e Nintendo. Controles, HDs e mais.',
    image: ps5Image,
    color: 'rgba(0, 100, 255, 0.3)',
  },
  {
    id: 3,
    titlePart1: 'Telas e',
    titlePart2: 'Baterias',
    description: 'Displays e baterias de alta qualidade para smartphones. Originais e compatíveis.',
    image: iphoneImage,
    color: 'rgba(255, 215, 0, 0.2)',
  },
  // Bottom Row
  {
    id: 4,
    titlePart1: 'Acessórios',
    titlePart2: 'Gaming',
    description: 'Controles, headsets, cabos e acessórios para sua jogatina. Diversas marcas.',
    image: xboxImage,
    color: 'rgba(16, 124, 16, 0.3)',
  },
  {
    id: 5,
    titlePart1: 'Peças para',
    titlePart2: 'Notebooks',
    description: 'Telas, teclados, baterias e componentes para notebooks de todas as marcas.',
    image: notebookImage,
    color: 'rgba(255, 50, 50, 0.3)',
  },
  {
    id: 6,
    titlePart1: 'Componentes',
    titlePart2: 'Celulares',
    description: 'Telas, baterias, conectores e peças para smartphones. Qualidade garantida.',
    image: celularesImage,
    color: 'rgba(0, 255, 150, 0.2)',
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

  const handleWhatsAppClick = useCallback(() => {
    openWhatsAppForService(serviceName);
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
          
          {/* Image Pop-out */}
          <CardItem translateZ="100" className="w-full mt-auto mb-6 flex justify-center items-center">
             <div className="relative w-full h-[200px] flex items-center justify-center">
                <img
                  src={service.image}
                  alt={`${service.titlePart1} ${service.titlePart2}`}
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
              onClick={handleWhatsAppClick}
              className="rounded-full !px-6 border-whatsapp text-whatsapp hover:bg-whatsapp hover:text-white w-full md:w-auto"
            >
              Solicitar Orçamento
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
            title="Nossos Produtos"
            subtitle="Peças e componentes de qualidade para seus dispositivos"
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
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className="bg-black text-[#FFD700] flex items-center space-x-2 px-8 py-3 font-semibold text-lg hover:text-[#FFED4E] transition-colors"
          >
            <span>Saiba Mais</span>
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  )
}