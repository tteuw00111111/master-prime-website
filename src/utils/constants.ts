import {
  FaTools,
  FaMobileAlt,
  FaBatteryFull,
  FaDesktop,
  FaGamepad,
  FaWater,
  FaWhatsapp,
  FaBoxOpen,
  FaDollarSign,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import { TbTruckDelivery } from 'react-icons/tb'
import { BiSupport } from 'react-icons/bi'
import { IoShieldCheckmark } from 'react-icons/io5'
import type { SiteConfig, TrustBadge, Service, Step, Testimonial, FAQItem, NavigationItem } from '@/types'

export const SITE_CONFIG: SiteConfig = {
  name: 'Master Prime',
  tagline: 'Peças e Componentes para seu Dispositivo!',
  location: 'Para Todo - Rio de Janeiro',
  whatsappNumber: '5521967635340',
  email: 'masterprime443@gmail.com',
  address: {
    street: 'Av. Cesário de Melo, 2581 - Campo Grande',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '23052-102',
  },
  hours: {
    weekdays: 'Segunda a Sexta: 09:00 - 19:00',
    saturday: 'Sábado: 09:00 - 16:00',
    sunday: 'Domingo: Fechado',
  },
  social: {
    instagram: 'https://www.instagram.com/masterprimecg',
    facebook: '',
  },
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Início', href: '#hero' },
  { name: 'Produtos', href: '#services' },
  { name: 'Como Funciona', href: '#how-it-works' },
  { name: 'Clientes', href: '#testimonials' },
  { name: 'Localização', href: '#location' },
  { name: 'FAQ', href: '#faq' },
]

export const TRUST_BADGES: TrustBadge[] = [
  {
    icon: TbTruckDelivery,
    title: 'Entrega segura e rastreada',
    description: '',
  },
  {
    icon: BiSupport,
    title: 'Atendimento via WhatsApp',
    description: '',
  },
  {
    icon: IoShieldCheckmark,
    title: 'Garantia de 1 Ano',
    description: '',
  },
]

export const SERVICES: Service[] = [
  {
    id: 1,
    name: 'Telas e Displays',
    description: 'Telas de alta qualidade para diversos modelos. Originais e compatíveis com garantia.',
    icon: FaMobileAlt,
    devices: ['Smartphones', 'Tablets', 'Notebooks'],
    price: 'A partir de R$ 150',
  },
  {
    id: 2,
    name: 'Baterias',
    description: 'Baterias novas para seu dispositivo durar o dia todo. Alta capacidade e durabilidade.',
    icon: FaBatteryFull,
    devices: ['Celulares', 'Tablets', 'Notebooks'],
    price: 'A partir de R$ 120',
  },
  {
    id: 3,
    name: 'Placas e Componentes',
    description: 'Componentes eletrônicos e placas para diversos dispositivos. Qualidade garantida.',
    icon: FaTools,
    devices: ['Smartphones', 'Notebooks'],
    price: 'Consulte-nos',
  },
  {
    id: 4,
    name: 'Acessórios',
    description: 'Capas, películas, carregadores e acessórios para seu dispositivo.',
    icon: FaDesktop,
    devices: ['Notebooks', 'Desktops', 'Consoles'],
    price: 'A partir de R$ 30',
  },
  {
    id: 5,
    name: 'Cabos e Conectores',
    description: 'Cabos de dados, carregamento e conectores diversos. Compatibilidade total.',
    icon: FaWater,
    devices: ['Smartphones', 'HDs', 'SSDs'],
    price: 'Consulte-nos',
  },
  {
    id: 6,
    name: 'Peças para Consoles',
    description: 'Componentes e peças para PlayStation, Xbox e Nintendo. Diversos modelos.',
    icon: FaGamepad,
    devices: ['PS4', 'PS5', 'Xbox', 'Nintendo'],
    price: 'A partir de R$ 100',
  },
]

export const HOW_IT_WORKS: Step[] = [
  {
    step: 1,
    title: 'Entre em Contato',
    description: 'Fale conosco através do WhatsApp e informe qual peça ou componente você precisa.',
    icon: FaWhatsapp,
  },
  {
    step: 2,
    title: 'Orçamento Gratuito',
    description: 'Enviamos o orçamento sem compromisso, com detalhes sobre a peça e disponibilidade.',
    icon: FaDollarSign,
  },
  {
    step: 3,
    title: 'Confirmação do Pedido',
    description: 'Após aprovação, separamos sua peça e preparamos para envio ou retirada.',
    icon: FaMapMarkerAlt,
  },
  {
    step: 4,
    title: 'Qualidade Garantida',
    description: 'Todas as peças passam por verificação de qualidade antes do envio.',
    icon: IoShieldCheckmark,
  },
  {
    step: 5,
    title: 'Entrega Grátis',
    description: 'Entregamos suas peças no seu endereço em todo Rio de Janeiro, sem custos adicionais de frete.',
    icon: FaBoxOpen,
  },
]

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Matheus Jacob',
    rating: 5,
    text: 'Antes e depois ! Muito grato pelo atendimento, precisava urgentemente do notebook. E conseguiram me ajudar em pleno domingo! Parabéns , pelo atendimento, preço justo, qualidade do equipamento que trocou. Parabéns !!!!!!',
    date: '5 stars',
    link: 'https://maps.app.goo.gl/9k9WTkFrW721xqKT7',
  },
  {
    id: 2,
    name: 'Rafael Wertz',
    rating: 5,
    text: 'Fui muito bem atendido, Pedro foi muito solícito e rápido na resolução do que eu tinha de necessidade, mas além disso identificou o problema (cooler na foto) e substituiu. Voltarei sempre que precisar e indico.',
    date: '5 stars',
    link: 'https://maps.app.goo.gl/bBrbo6Cbokf7qG4H7',
  },
  {
    id: 3,
    name: 'Celso Luiz',
    rating: 5,
    text: 'Excelente atendimento. Levei meu celular com a tela abrindo e resolveram em minutos.Top demais.',
    date: '5 stars',
    link: 'https://maps.app.goo.gl/s9B3MHoyb8Z9MUQX7',
  },
  {
    id: 4,
    name: 'Paulo Mendes',
    rating: 5,
    text: 'Sem palavras para descrever minha satisfação ....desde de o começo muito bem atendido, super indico estão de parabéns!!!!',
    date: '5 stars',
    link: 'https://maps.app.goo.gl/tC8A2pXrFaEpXehf6',
  },
  {
    id: 5,
    name: 'Raquel Ferreira',
    rating: 5,
    text: 'simplismente me salvaram !! estou operada e a master prime enviou uma equipe para fazer a manutenção do meu celular no meu condominio, alem da qualidade do serviço, o atendimento e prestação de serviço foi exelente. já sou cliente do pedro e indico de olhos fechados O Pedro sempre me atende com profissionalismo e dedicação',
    date: '5 stars',
    link: 'https://maps.app.goo.gl/5TsxSGEu1k7HvaBAA',
  },
]

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Quanto tempo demora a entrega?',
    answer: 'Para peças em estoque, entregamos no mesmo dia ou em até 24 horas. Para peças sob encomenda, o prazo varia de 3 a 7 dias úteis.',
  },
  {
    question: 'Vocês oferecem garantia nas peças?',
    answer: 'Sim! Todas as nossas peças vêm com garantia de 1 ano contra defeitos de fabricação.',
  },
  {
    question: 'Quais formas de pagamento aceitam?',
    answer: 'Aceitamos dinheiro, PIX, cartões de débito e crédito (parcelamento em até 3x sem juros), e transferência bancária.',
  },
  {
    question: 'Posso verificar a peça antes de comprar?',
    answer: 'Sim! Você pode visitar nossa loja para verificar a peça pessoalmente antes de finalizar a compra.',
  },
  {
    question: 'Trabalham com peças para quais dispositivos?',
    answer: 'Temos peças para smartphones, tablets, notebooks e consoles de diversas marcas e modelos.',
  },
  {
    question: 'As peças são originais ou compatíveis?',
    answer: 'Trabalhamos tanto com peças originais quanto com peças compatíveis de alta qualidade. Você escolhe a opção que melhor se adequa ao seu orçamento.',
  },
  {
    question: 'Preciso agendar para visitar a loja?',
    answer: 'Não é necessário agendar, mas recomendamos entrar em contato antes via WhatsApp para confirmar disponibilidade da peça.',
  },
  {
    question: 'Vocês fazem entrega?',
    answer: 'Sim! A entrega é totalmente gratuita para toda a região do Rio de Janeiro.',
  },
]
