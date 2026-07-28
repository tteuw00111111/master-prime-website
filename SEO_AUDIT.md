# Auditoria e implementação de SEO — Master Prime

Data da auditoria: 28 de julho de 2026  
Repositório analisado: `main`, commit-base `2f0832e` (`Fix site favicon assets`)  
Domínio canônico: <https://master-prime.com/>

## Resumo executivo

O site partia de uma landing page voltada a peças e acessórios, com linguagem restritiva herdada de campanhas, embora a atividade principal atual seja assistência técnica. A implementação reposicionou a página para buscas locais por assistência e manutenção sem reorganizar a home, adicionar seções, mudar estilos ou criar páginas repetitivas.

O índice estimado de saúde de SEO evoluiu de **59/100 (Needs Work)** para **89/100 (Good)**. A estimativa considera apenas evidências verificáveis no repositório e no ambiente local; dados de Google Search Console, Google Business Profile, CrUX, backlinks e tráfego não estavam disponíveis.

| Categoria | Peso | Inicial | Final | Contribuição final |
|---|---:|---:|---:|---:|
| Rastreabilidade e indexação | 30% | 55 | 95 | 28,5 |
| SEO técnico e performance | 25% | 75 | 84 | 21,0 |
| SEO on-page | 20% | 55 | 96 | 19,2 |
| Conteúdo | 15% | 50 | 86 | 12,9 |
| Autoridade e SEO local | 10% | 55 | 75 | 7,5 |
| **SEO Health Index** | **100%** | **59** | **89** | **89,1** |

O score final não é uma pontuação do Google nem substitui dados de campo. Ele serve para priorizar o trabalho confirmado nesta auditoria.

## Estado inicial do repositório

- Framework: React 18.3.1 com TypeScript 5.5, Vite 5.4 e Tailwind CSS 3.4.
- Renderização: SPA client-side, sem React Router e sem SSR/pré-renderização.
- Rotas públicas encontradas:
  - `/` — aplicação React;
  - `/politica-de-privacidade` — HTML estático;
  - `/presell` — landing page de campanha antiga.
- Estrutura da home: Hero, Serviços, Como Funciona, Depoimentos, Localização, FAQ e Rodapé.
- Componentes compartilhados: botões, cards 3D, headings, animações, navegação, utilitários de WhatsApp e configurações comerciais.
- Metadata: tags estáticas em `index.html`; a política possuía metadata parcial.
- Analytics: Google Tag Manager `GTM-P3RV75ZD`, Meta Pixel `1430740015202870` e Microsoft Clarity `v6kk9ke9ye`.
- Build/deploy: `tsc && vite build`, saída `dist`, configuração da Vercel.
- Fontes: Britanica local em WOFF/WOFF2 e Inter carregada de Google Fonts.
- Imagens: WebP locais e otimizador de imagens já configurado no build.
- O `git status` estava limpo no começo desta auditoria. A versão original do design já estava restaurada no `HEAD`; portanto, não havia redesign pendente para reverter seletivamente.

## Congelamento visual

Foram capturadas referências em 1440 × 1100 e 390 × 844 antes das mudanças. Depois da implementação, as mesmas resoluções foram verificadas em navegador real.

Não foram alterados:

- `src/styles/globals.css`;
- `src/styles/fonts.css`;
- `tailwind.config.js`;
- `src/App.tsx`;
- ordem das seções;
- classes de layout, cores, tipografia, espaçamento, breakpoints, animações, imagens ou fluxo de navegação.

Arquivos JSX de apresentação foram modificados somente para trocar conteúdo factual, corrigir links/atributos, usar headings semanticamente adequados e informar dimensões intrínsecas de imagens. A aparência material permaneceu igual; a única diferença visível intencional é o texto, agora direto sobre assistência técnica.

## Problemas encontrados e tratamento

### 1. Catch-all da SPA produzia soft 404

- **Issue:** toda URL desconhecida era reescrita para a home.
- **Category:** Rastreabilidade e indexação.
- **Evidence:** `vercel.json` continha `/(.*) -> /index.html`.
- **Severity:** Critical.
- **Confidence:** High.
- **Why It Matters:** URLs inexistentes poderiam responder `200`, consumir rastreamento e confundir indexação.
- **Score Impact:** -20 pontos na categoria de rastreabilidade.
- **Recommendation:** remover o catch-all e deixar a hospedagem devolver `404`; implementado. O status final deve ser reconfirmado após o próximo deploy.

### 2. Ausência de sitemap e robots

- **Issue:** não existiam `sitemap.xml` e `robots.txt`.
- **Category:** Rastreabilidade e indexação.
- **Evidence:** arquivos ausentes em `public/`.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** dificultava a descoberta consistente das URLs canônicas.
- **Score Impact:** -15 pontos na categoria de rastreabilidade.
- **Recommendation:** publicar arquivos de descoberta com apenas URLs canônicas; implementado.

### 3. Metadata e domínio inconsistentes

- **Issue:** title, description e H1 eram orientados a peças; OG/Twitter apontavam para `masterprime.com.br`; canonical não existia; havia meta keywords e imagem social inexistente.
- **Category:** SEO on-page.
- **Evidence:** estado inicial de `index.html`.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** a página não comunicava a intenção principal e podia consolidar sinais em um host incorreto.
- **Score Impact:** -20 pontos em on-page.
- **Recommendation:** metadata única, canonical absoluto, social tags completas e remoção de meta keywords; implementado.

### 4. Endereço, telefone e mapa incorretos

- **Issue:** o código exibia o número 2581, o FAQ apontava para um telefone placeholder e o link curto do Google resolvia para o endereço antigo.
- **Category:** Autoridade e SEO local.
- **Evidence:** `src/utils/constants.ts`, `src/components/sections/FAQ.tsx` e validação HTTP do link `share.google`, que redirecionou para uma busca por “Av. Cesário de Melo, 2581”.
- **Severity:** Critical.
- **Confidence:** High.
- **Why It Matters:** NAP divergente prejudica confiança, conversão e consistência com o Perfil da Empresa.
- **Score Impact:** -25 pontos em autoridade/local.
- **Recommendation:** padronizar 2571 e substituir o link por uma rota explícita do Google Maps para o endereço canônico; implementado. O endereço do Perfil da Empresa ainda precisa ser corrigido manualmente.

### 5. Ausência de entidade local estruturada

- **Issue:** não havia JSON-LD para a empresa.
- **Category:** SEO técnico e autoridade local.
- **Evidence:** nenhum bloco `application/ld+json` no estado inicial.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** mecanismos de busca não recebiam uma definição consistente da entidade, NAP, horários e área atendida.
- **Score Impact:** -10 pontos em técnico e -10 em autoridade/local.
- **Recommendation:** adicionar uma entidade `ComputerStore` com `@id` estável, endereço, telefone, horários confirmados no projeto, `areaServed`, Instagram, mapa e catálogo real de serviços; implementado. Não foram adicionados preço, coordenadas, garantia, rating ou reviews ao schema.

### 6. Conteúdo visível não correspondia à atividade principal

- **Issue:** a home priorizava “peças e componentes” e evitava termos objetivos como assistência técnica, conserto e manutenção.
- **Category:** Conteúdo.
- **Evidence:** H1, subtítulo, cards e CTAs no `HEAD` inicial.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** o conteúdo tinha baixa correspondência com as buscas locais relevantes e com os serviços reais.
- **Score Impact:** -20 pontos em conteúdo.
- **Recommendation:** reescrever dentro dos componentes existentes; implementado com H1 “Assistência Técnica em Campo Grande”, cards de serviços reais, processo conservador e FAQs úteis.

### 7. Afirmações comerciais sem confirmação

- **Issue:** havia garantia de um ano, entrega grátis, prazos, marcas, compatibilidade total, preços “a partir de” e outras promessas não confirmadas.
- **Category:** Conteúdo.
- **Evidence:** constantes, badges, FAQ, CTA e mensagens de WhatsApp no estado inicial.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** informações não comprovadas reduzem confiança e poderiam voltar a ser publicadas por componentes futuros.
- **Score Impact:** -15 pontos em conteúdo.
- **Recommendation:** substituir por formulações verificáveis e conservadoras; implementado. A prova social “mais de 500 avaliações com 5 estrelas no Google” foi mantida porque o responsável confirmou o dado; ela não foi inserida em structured data.

### 8. Página antiga de campanha continuava indexável

- **Issue:** `/presell` permanecia no conjunto de páginas públicas sem função atual.
- **Category:** Rastreabilidade e indexação.
- **Evidence:** `public/presell/index.html` e ausência de redirect.
- **Severity:** Medium.
- **Confidence:** High.
- **Why It Matters:** poderia competir com a home e manter linguagem antiga.
- **Score Impact:** -10 pontos em rastreabilidade.
- **Recommendation:** 301 específico para a página semanticamente mais próxima; implementado para `/presell`, `/presell/` e `/presell/index.html`. O asset `/presell/logo.webp` foi preservado porque a política de privacidade o utiliza.

### 9. Links e controles com problemas funcionais ou semânticos

- **Issue:** o link de FAQ usava telefone falso, o botão “Saiba Mais” não fazia nada, cards não eram headings e o rodapé saltava para `h4`.
- **Category:** SEO on-page e acessibilidade.
- **Evidence:** componentes `FAQ`, `Services`, `TrustBadges` e `Footer`.
- **Severity:** Medium.
- **Confidence:** High.
- **Why It Matters:** reduz clareza, navegação, hierarquia e acessibilidade.
- **Score Impact:** -10 pontos em on-page.
- **Recommendation:** corrigir destinos e semântica sem mudar classes ou aparência; implementado.

### 10. Dimensões intrínsecas ausentes em imagens

- **Issue:** imagens do logo, hero e cards não declaravam dimensões no HTML.
- **Category:** SEO técnico e performance.
- **Evidence:** componentes no estado inicial.
- **Severity:** Low.
- **Confidence:** High.
- **Why It Matters:** dimensões ajudam o navegador a reservar espaço e reduzem risco de layout shift.
- **Score Impact:** -5 pontos em técnico.
- **Recommendation:** informar dimensões reais preservando classes e tamanhos renderizados; implementado.

### 11. Conteúdo principal depende de JavaScript

- **Issue:** o HTML inicial da home contém metadata, scripts e um `#root` vazio; o texto principal é renderizado no cliente.
- **Category:** SEO técnico.
- **Evidence:** arquitetura Vite SPA em `src/main.tsx` e `index.html`.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** o Google normalmente renderiza JavaScript, mas pré-renderização reduz dependência da segunda fase de processamento e melhora robustez.
- **Score Impact:** -10 pontos técnicos no estado final.
- **Recommendation:** avaliar pré-renderização/SSR em uma etapa futura. Não implementado porque exigiria alteração arquitetural com risco sobre o design e o deploy.

### 12. JavaScript interativo e terceiros ainda pesam no carregamento

- **Issue:** a página usa Framer Motion, canvas interativo e três integrações de analytics.
- **Category:** SEO técnico e performance.
- **Evidence:** chunk de motion com cerca de 120 kB, React com cerca de 139 kB e scripts de GTM, Meta Pixel e Clarity.
- **Severity:** Medium.
- **Confidence:** High para o peso; Medium para o impacto real sem dados de campo.
- **Why It Matters:** pode afetar LCP/INP em aparelhos modestos.
- **Score Impact:** -6 pontos técnicos no estado final.
- **Recommendation:** medir CrUX/Search Console e revisar tags no GTM antes de remover ou adiar scripts. Não alterado para não quebrar analytics nem animações.

### 13. Falta de páginas específicas de serviço

- **Issue:** celular, notebook, computador, impressora e videogame dividem a mesma home.
- **Category:** Conteúdo.
- **Evidence:** ausência de roteador e apenas duas URLs indexáveis.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** limita profundidade e capacidade de responder separadamente a cada intenção.
- **Score Impact:** -10 pontos de conteúdo no estado final.
- **Recommendation:** criar páginas completas somente em uma fase aprovada, reutilizando integralmente o design atual. Não implementado para respeitar a instrução de não criar rotas automaticamente e o congelamento visual.

### 14. Perfil da Empresa ainda aponta para o endereço antigo

- **Issue:** o link público existente do Google resolvia para 2581.
- **Category:** Autoridade e SEO local.
- **Evidence:** redirecionamento HTTP do link curto validado em 28/07/2026.
- **Severity:** Critical.
- **Confidence:** High.
- **Why It Matters:** o site agora informa 2571, mas a entidade externa mais importante pode continuar divergente.
- **Score Impact:** -15 pontos de autoridade/local no estado final.
- **Recommendation:** corrigir o endereço diretamente no Google Business Profile e gerar um novo link oficial de localização.

## Alterações implementadas

### Metadata e on-page

- Home:
  - title `Assistência Técnica em Campo Grande RJ | Master Prime`;
  - description exclusiva;
  - canonical autorreferente;
  - robots index/follow;
  - Open Graph e Twitter completos;
  - `lang="pt-BR"` preservado;
  - meta keywords removida.
- Política de privacidade:
  - title e description exclusivos;
  - canonical;
  - Open Graph, Twitter e JSON-LD `WebPage`.
- H1 reposicionado para assistência técnica e cards reescritos com serviços reais.
- Hierarquia corrigida para H1, H2 e H3 sem classes visuais alteradas.
- CTAs mantidos nos mesmos componentes e direcionados ao WhatsApp correto.

### SEO local e conteúdo

- NAP padronizado:
  - Master Prime Assistência;
  - Avenida Cesário de Melo, 2571;
  - Campo Grande, Rio de Janeiro - RJ;
  - CEP 23052-102;
  - (21) 96763-5340.
- Rodapé passou a exibir nome, endereço completo, CEP e telefone.
- Áreas de retirada e entrega inseridas naturalmente no FAQ e no schema.
- Serviços de celular, notebook, computador, impressora, videogame e controle descritos em linguagem objetiva.
- Peças, acessórios, computadores montados e PC gamer permaneceram como oferta secundária.
- Provas/promessas não confirmadas foram removidas.

### Structured data

- `ComputerStore` na home, por ser um subtipo de `LocalBusiness` compatível com a atividade.
- Identificador central: `https://master-prime.com/#localbusiness`.
- Campos: nome, nome alternativo, URL, telefone, descrição, logo/imagem, endereço, mapa, horários do projeto, Instagram, áreas atendidas e `hasOfferCatalog`.
- O catálogo possui somente serviços realmente visíveis no site e não contém preços.
- `WebPage` na política apontando para a mesma entidade por `@id`.
- Não foram usados `aggregateRating`, reviews, coordenadas, marcas, preços, garantias ou FAQ schema.
- Não existem páginas individuais de serviço; portanto, não foi criado `Service` schema em URLs inexistentes.

### Rastreamento, sitemap, robots e redirects

- `public/sitemap.xml` criado com `/` e `/politica-de-privacidade`.
- `public/robots.txt` criado, permitindo recursos públicos, bloqueando `/api/` e declarando sitemap absoluto.
- Catch-all removido para permitir 404 real em URLs desconhecidas.
- Redirects 301 específicos adicionados para a rota antiga `/presell`.
- Nenhuma referência pública a `lp.master-prime.com`, 2581, 2869, `masterprime.com.br` ou telefone placeholder permanece no conteúdo indexável.
- Configuração de projeto/domínio da Vercel não foi removida.

### Performance e acessibilidade

- Dimensões reais adicionadas a logos, hero e imagens de cards.
- Lazy loading existente nas imagens abaixo da dobra foi preservado.
- Imagem de hero continua com prioridade alta para LCP.
- Otimização WebP e divisão de chunks existentes foram preservadas.
- Link de WhatsApp falso corrigido.
- Botão sem ação recebeu destino real.
- Alt text factual foi mantido/corrigido.
- Headings de cards, badges e rodapé foram ajustados semanticamente sem mudança visual.
- Nenhum arquivo CSS, tema, Tailwind, animação ou breakpoint foi alterado.

## Arquivos modificados

### Configuração e documentação

- `.env.example`
- `.eslintrc.cjs`
- `README.md`
- `package.json`
- `vercel.json`
- `scripts/validate-seo.mjs`
- `SEO_AUDIT.md`
- `SEO_KEYWORD_MAP.md`

### SEO estático e descoberta

- `index.html`
- `public/politica-de-privacidade/index.html`
- `public/robots.txt`
- `public/sitemap.xml`

### Conteúdo e atributos nos componentes existentes

- `src/components/layout/Footer.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileMenu.tsx`
- `src/components/sections/FAQ.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Location.tsx`
- `src/components/sections/Services.tsx`
- `src/components/sections/Testimonials.tsx`
- `src/components/sections/TrustBadges.tsx`
- `src/utils/constants.ts`
- `src/utils/whatsapp.ts`

Não houve arquivos de estilo modificados.

## Páginas e redirects

- Novas páginas: nenhuma.
- Páginas indexáveis: `/` e `/politica-de-privacidade`.
- Redirects adicionados:
  - `/presell` → `/` (301);
  - `/presell/` → `/` (301);
  - `/presell/index.html` → `/` (301).

## Validação executada

| Verificação | Resultado |
|---|---|
| `npm run lint` | PASS, sem warnings |
| `npm run typecheck` | PASS |
| `npm test` | PASS; metadata, JSON-LD, sitemap, robots, redirects, NAP, serviços e referências proibidas |
| `npm run build` | PASS; 430 módulos transformados |
| `git diff --check` | PASS |
| Desktop 1440 × 1100 | PASS; composição preservada |
| Mobile 390 × 844 | PASS; sem corte ou overflow no H1 |
| Links externos | WhatsApp, Instagram, mapa e cinco links de avaliações responderam 200 |
| JSON-LD | JSON analisado sintaticamente pelo teste automatizado |
| Endereço proibido/subdomínio | nenhuma ocorrência no conteúdo público validado |

Limitação: o comportamento real de headers, redirects e 404 da Vercel só pode ser confirmado depois do deploy, que não foi autorizado. Nenhum deploy foi feito.

## Dados comerciais que ainda precisam de confirmação

- O e-mail `masterprime443@gmail.com` foi preservado do repositório, mas não foi confirmado externamente.
- Os horários 09:00–19:00 de segunda a sexta e 09:00–16:00 no sábado foram preservados por estarem consistentes no projeto; devem permanecer alinhados ao Perfil da Empresa.
- O número “mais de 500 avaliações com 5 estrelas” foi fornecido e confirmado pelo responsável durante esta tarefa. Não foi copiado para structured data.
- Não foram adicionadas coordenadas porque não havia fonte segura e o link do Perfil da Empresa estava associado ao endereço antigo.

## Ações manuais restantes

1. Corrigir o endereço da Master Prime no Google Business Profile de 2581 para 2571 e obter um novo link oficial da ficha.
2. Depois de publicar, validar `/presell` como 301 e uma URL inexistente como 404 real.
3. Enviar `https://master-prime.com/sitemap.xml` ao Google Search Console e solicitar nova indexação da home.
4. Validar a home no Rich Results Test/Schema Markup Validator após a publicação.
5. Verificar Core Web Vitals de campo no Search Console/CrUX; não havia dados de usuários reais disponíveis localmente.
6. Auditar o contêiner GTM e remover tags de Google Ads que ainda estejam publicadas. O código do site não revela a configuração interna do contêiner.
7. Confirmar e manter NAP, horários, telefone, categorias e serviços idênticos no Perfil da Empresa e no Instagram.
8. Produzir uma imagem Open Graph própria em 1200 × 630; por enquanto é usado o logo existente para não inventar/substituir material visual.
9. Considerar páginas completas de serviço em uma etapa separada, reutilizando o design atual e sem criar páginas por bairro.

## Comandos executados

```text
git status --short
git status --porcelain=v2
git diff
git diff --check
git diff --name-only
git log -1
rg / rg --files
npm run dev -- --host 0.0.0.0
npm run lint
npm run typecheck
npm test
npm run build
curl -L (links públicos)
google-chrome --headless (capturas desktop e mobile)
```

Nenhum commit, push ou deploy foi executado.
