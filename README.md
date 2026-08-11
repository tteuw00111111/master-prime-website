# Master Prime Assistência — site oficial

Site responsivo da Master Prime Assistência, com home e clusters de serviços pré-renderizados para Campo Grande, Rio de Janeiro.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool rápido e moderno
- **React DOM Server** - Pré-renderização estática das páginas indexáveis
- **Tailwind CSS** - Framework CSS utility-first
- **Framer Motion** - Biblioteca de animações
- **React Icons** - Ícones SVG como componentes React
- **React Hook Form** - Gerenciamento de formulários

## ✨ Funcionalidades

### Seções da Landing Page
- **Hero** - Seção principal com CTA e showcase do dispositivo
- **Trust Badges** - Informações sobre retirada, WhatsApp e loja física
- **Serviços** - Grid de serviços oferecidos
- **Como Funciona** - Timeline do processo de atendimento
- **Clientes Satisfeitos** - Depoimentos e avaliações
- **Localização** - Mapa, endereço e horários
- **FAQ** - Perguntas frequentes com accordion

### Destaques Técnicos
- 🎨 **Glassmorphism** - Efeito de vidro estilo iPhone nos botões
- 🌙 **Dark Theme** - Tema escuro com acentos dourados
- ✨ **Animações suaves** - Scroll reveal e micro-interactions
- 📱 **Responsivo** - Design mobile-first
- 🇧🇷 **PT-BR** - Todo conteúdo em português brasileiro
- 💬 **WhatsApp** - Integração direta com WhatsApp

## 🎨 Design System

### Cores
- **Dark Background**: `#0A0A0A`
- **Card Background**: `#151515`
- **Gold Primary**: `#FFD700`
- **Gold Light**: `#FFED4E`
- **WhatsApp Green**: `#25D366`

### Tipografia
- **Heading**: Poppins (Bold, Semi-bold)
- **Body**: Inter (Regular, Medium)

## 📁 Estrutura do Projeto

```
master_prime_website/
├── src/
│   ├── assets/
│   │   └── images/          # Imagens e assets
│   ├── components/
│   │   ├── animations/      # Componentes de animação
│   │   ├── layout/          # Header, Footer, Navigation
│   │   ├── sections/        # Seções da landing page
│   │   └── ui/              # Componentes UI reutilizáveis
│   ├── data/                # Conteúdo canônico das páginas SEO
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   ├── utils/               # Funções utilitárias
│   ├── styles/              # CSS global
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Entry point
├── public/                  # Assets estáticos
├── scripts/                 # Pré-renderização e validação SEO
├── .agents/skills/          # Workflow local reutilizável
├── .env                     # Variáveis de ambiente
└── package.json
```

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. Clone o repositório (se aplicável):
```bash
git clone <repository-url>
cd master_prime_website
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas informações:
```env
VITE_WHATSAPP_NUMBER=5521967635340
VITE_WHATSAPP_MESSAGE=Olá! Gostaria de solicitar um orçamento.
VITE_GOOGLE_MAPS_EMBED_URL=https://www.google.com/maps?q=Avenida%20Ces%C3%A1rio%20de%20Melo%2C%202571%2C%20Campo%20Grande%2C%20Rio%20de%20Janeiro%20RJ&output=embed
```

### Desenvolvimento

Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O site estará disponível em `http://localhost:5173/`

### Build para Produção

Gere o cliente, o bundle SSR e os documentos HTML estáticos:
```bash
npm run build
```

O build cria 25 documentos React pré-renderizados e preserva a política de privacidade estática, totalizando 26 URLs indexáveis no sitemap.

Preview da build:
```bash
npm run preview
```

## 🎯 Funcionalidades WhatsApp

O site possui integração com WhatsApp em diversos pontos:

- Botão principal no Hero
- Links em cada serviço
- Floating button (opcional)
- Seção de contato

As mensagens são pré-formatadas de acordo com o contexto do clique.

## 🎨 Efeito Glassmorphism

O efeito de vidro estilo iPhone foi implementado com:

- **Backdrop blur** - Desfoque do fundo
- **Transparência** - Background semi-transparente
- **Bordas sutis** - Bordas com baixa opacidade
- **Sombras** - Sombras suaves com cor dourada
- **Shine effect** - Gradiente que se revela no hover

Exemplo de uso:
```tsx
<Button variant="glass">
  Solicitar Orçamento
</Button>
```

## 📱 Responsividade

Breakpoints utilizados:
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+
- **Large Desktop**: 1280px+

## 🚀 Próximos Passos

### Integrações Futuras
- [ ] Three.js para showcase 3D do dispositivo
- [ ] Backend API para formulários
- [ ] Google Analytics
- [ ] Sistema de agendamento online
- [ ] Chat ao vivo

### Melhorias Planejadas
- [x] Otimização de imagens (WebP)
- [x] Páginas de serviço pré-renderizadas
- [x] Sitemap, robots, canonicals e structured data
- [ ] Fotos reais de bancada e reparos nos slots preparados
- [ ] PWA (Progressive Web App)
- [x] SEO técnico e conteúdo por intenção
- [x] Testes automatizados de SEO
- [ ] Storybook para componentes

## 📝 Customização de Conteúdo

Conteúdo da home e conteúdo das páginas de serviço ficam, respectivamente, em:
```
src/utils/constants.ts
src/data/seo-pages.json
```

Ao adicionar ou alterar uma página, mantenha metadata, intenção, links e regras de `AGENTS.md` consistentes e execute o build/teste completo.

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto foi desenvolvido para Master Prime.

## 🙏 Agradecimentos

- Design baseado no Figma fornecido
- Ícones por [React Icons](https://react-icons.github.io/react-icons/)
- Animações por [Framer Motion](https://www.framer.com/motion/)

---

**Master Prime** - Conserto Rápido e Profissional 🛠️⚡
