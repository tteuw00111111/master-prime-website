import {
  FaTools,
  FaMobileAlt,
  FaBatteryFull,
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
  name: 'Master Prime Assistência',
  tagline: 'Assistência Técnica em Campo Grande',
  location: 'Campo Grande - Rio de Janeiro',
  whatsappNumber: '5521967635340',
  email: 'masterprime443@gmail.com',
  address: {
    street: 'Avenida Cesário de Melo, 2571 - Campo Grande',
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
  { name: 'Início', href: '/' },
  { name: 'Serviços', href: '/servicos' },
  { name: 'Como Funciona', href: '/#how-it-works' },
  { name: 'Clientes', href: '/#testimonials' },
  { name: 'Localização', href: '/#location' },
  { name: 'FAQ', href: '/#faq' },
]

export const TRUST_BADGES: TrustBadge[] = [
  {
    icon: TbTruckDelivery,
    title: 'Retirada e entrega',
    description: '',
  },
  {
    icon: BiSupport,
    title: 'Atendimento via WhatsApp',
    description: '',
  },
  {
    icon: IoShieldCheckmark,
    title: 'Loja física em Campo Grande',
    description: '',
  },
]

export const SERVICES: Service[] = [
  {
    id: 1,
    name: 'Manutenção de Celulares',
    description: 'Troca de tela e bateria, conector de carga, placa, desoxidação, sistema e diagnóstico.',
    icon: FaMobileAlt,
    devices: ['Celulares'],
  },
  {
    id: 2,
    name: 'Manutenção de Notebooks',
    description: 'Dobradiça, tela, teclado, bateria, SSD, placa-mãe, formatação, limpeza e diagnóstico.',
    icon: FaBatteryFull,
    devices: ['Notebooks'],
  },
  {
    id: 3,
    name: 'Manutenção de Computadores',
    description: 'Diagnóstico de hardware, limpeza interna, formatação, remoção de vírus, SSD e upgrades.',
    icon: FaTools,
    devices: ['Computadores', 'PC gamer'],
  },
  {
    id: 4,
    name: 'Videogames e Controles',
    description: 'Manutenção de console e controle, correção de drift e instalação de analógicos Hall Effect.',
    icon: FaWater,
    devices: ['Videogames', 'Controles'],
  },
  {
    id: 5,
    name: 'Peças, Acessórios e PC Gamer',
    description: 'Peças e acessórios para eletrônicos, computadores montados e PC gamer.',
    icon: FaGamepad,
    devices: ['Eletrônicos', 'Computadores'],
  },
]

export const HOW_IT_WORKS: Step[] = [
  {
    step: 1,
    title: 'Entre em Contato',
    description: 'Informe pelo WhatsApp o aparelho, modelo, sintoma ou item que procura.',
    icon: FaWhatsapp,
  },
  {
    step: 2,
    title: 'Solicite Orçamento',
    description: 'A equipe confirma o atendimento e a disponibilidade depois de receber os detalhes.',
    icon: FaDollarSign,
  },
  {
    step: 3,
    title: 'Combine o Atendimento',
    description: 'Leve o aparelho à loja ou consulte a disponibilidade de retirada e entrega.',
    icon: FaMapMarkerAlt,
  },
  {
    step: 4,
    title: 'Atendimento Técnico',
    description: 'O equipamento é avaliado antes da indicação do serviço aplicável.',
    icon: IoShieldCheckmark,
  },
  {
    step: 5,
    title: 'Retirada e Entrega',
    description: 'A retirada e a devolução são combinadas pelo WhatsApp nas áreas atendidas.',
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
    question: 'Vocês fazem orçamento antes do reparo?',
    answer: 'Entre em contato para informar o aparelho, o modelo e o sintoma. A disponibilidade e as condições do atendimento são confirmadas pela equipe.',
  },
  {
    question: 'A Master Prime busca e entrega o aparelho?',
    answer: 'Sim. A retirada é combinada pelo WhatsApp e o aparelho é devolvido depois do atendimento, conforme a disponibilidade para o endereço.',
  },
  {
    question: 'Quais bairros possuem retirada e entrega?',
    answer: 'A disponibilidade atual abrange Campo Grande, Bangu, Cosmos, Realengo, Guaratiba, Paciência, Santa Cruz e Santíssimo. Confirme o endereço pelo WhatsApp.',
  },
  {
    question: 'Posso levar o aparelho diretamente à loja?',
    answer: 'Sim. A loja física fica na Avenida Cesário de Melo, 2571, em Campo Grande, Rio de Janeiro.',
  },
  {
    question: 'Vocês consertam notebook que não liga?',
    answer: 'Sim. O atendimento começa pelo diagnóstico das possíveis causas. Informe o modelo e o sintoma para confirmar a disponibilidade.',
  },
  {
    question: 'Vocês fazem troca de dobradiça e upgrade para SSD?',
    answer: 'Sim. A troca de dobradiça e o upgrade de HDD para SSD dependem da avaliação e da compatibilidade com o notebook.',
  },
  {
    question: 'Vocês corrigem drift e instalam analógicos Hall Effect?',
    answer: 'Sim. O controle é avaliado para confirmar o reparo de drift e a compatibilidade com analógicos Hall Effect.',
  },
]
