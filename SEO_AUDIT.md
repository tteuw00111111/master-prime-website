# Auditoria e expansão de SEO — Master Prime Assistência

Data: 11 de agosto de 2026

Domínio canônico: <https://master-prime.com/>

Escopo: repositório completo, site publicado, desktop/mobile, SEO técnico, local, on-page, conteúdo, entidade, GEO/AEO e descoberta por buscadores

Mercado/idioma: Campo Grande, Rio de Janeiro/RJ; PT-BR

## Resumo executivo

O site partia de uma SPA React/Vite com boa identidade local, NAP visível, robots, sitemap, privacy page e uma entidade estruturada, mas praticamente toda intenção comercial estava concentrada na home. Não havia documento canônico para conserto de notebook, computador, celular, PC gamer, videogame, controle ou problemas específicos. A home e o JSON-LD ainda apresentavam impressoras como serviço, embora a atividade tenha sido encerrada.

A implementação preservou o design system e os componentes existentes, transformou a aplicação em saída pré-renderizada no build e criou 24 novas URLs: um hub geral e 23 páginas por intenção legítima. Cada página possui HTML completo, metadata própria, canonical autocanônico, H1, breadcrumb, links internos, CTA, respostas diretas, FAQ útil, `Service` schema e uma referência consistente ao `LocalBusiness` principal. Impressoras foram retiradas das ofertas atuais e `/inicio` recebeu redirect permanente configurado.

### SEO Health Index

- **Score anterior:** 85 / 100 — **Good**
- **Score após implementação:** 97 / 100 — **Excellent**
- **Delta de readiness:** +12 pontos

| Categoria | Peso | Anterior | Contribuição anterior | Atual | Contribuição atual |
|---|---:|---:|---:|---:|---:|
| Crawlability & Indexation | 30 | 94 | 28,2 | 100 | 30,0 |
| Technical Foundations | 25 | 87,5 | 21,9 | 97,5 | 24,4 |
| On-Page Optimization | 20 | 80 | 16,0 | 98 | 19,6 |
| Content Quality & E-E-A-T | 15 | 75 | 11,3 | 95 | 14,3 |
| Authority & Trust Signals | 10 | 80 | 8,0 | 90 | 9,0 |
| **SEO Health Index** | **100** |  | **85,4 → 85** |  | **97,2 → 97** |

O score resume prontidão técnica e editorial, não uma pontuação do Google e não uma garantia de ranking. O que impede nota maior é rastreável: a LP externa ainda responde 200, imagens reais de bancada/equipamentos ainda não foram fornecidas, a imagem social é o logo existente e não há dados de campo de Core Web Vitals. Concorrência, algoritmos, backlinks e resultados orgânicos não fazem parte do score.

## A) Estado anterior auditado

- React 18 + TypeScript + Vite 5 + Tailwind; aplicação client-side sem React Router, SSR ou pré-renderização.
- Rotas públicas no repositório: `/`, `/politica-de-privacidade` e `/presell` (esta última redirecionada por Vercel).
- Home composta por Hero, Serviços, Como Funciona, Depoimentos, Localização, FAQ e Footer.
- Metadata e canonical estáticos apenas para home; política com HTML e metadata próprios.
- `robots.txt` permitia páginas públicas e bloqueava `/api/`; sitemap continha somente home e política.
- JSON-LD `ComputerStore` tinha NAP, horários, Instagram, áreas atendidas e catálogo, mas incluía impressoras e áreas não reconfirmadas nesta tarefa.
- `/inicio` respondia 404 no site publicado em 11/08/2026, embora ainda existisse um resultado histórico com tela de redirecionamento.
- URL inexistente devolvia 404 real; não havia catch-all de soft 404.
- `lp.master-prime.com` respondia 200 e permanecia recuperável com promessas, endereço e conteúdo antigos. Ela não foi usada como fonte nem incorporada.
- Google Search Console, Analytics, GBP, Semrush autenticado, CrUX e dados de backlinks não estavam disponíveis.

## Findings classificados

### F1 — Conteúdo principal dependia de JavaScript

- **Issue:** o HTML inicial da home possuía `#root` vazio e as futuras páginas não teriam conteúdo crawlável sem renderização do cliente.
- **Category:** Technical Foundations.
- **Evidence:** `src/main.tsx` usava apenas `createRoot`; `index.html` continha `<div id="root"></div>`; build anterior tinha um único documento HTML React.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** aumenta dependência da fase de renderização de JavaScript e impede criar documentos estáticos robustos por intenção.
- **Score Impact:** −10 pontos técnicos antes da correção.
- **Recommendation:** pré-renderizar cada rota e hidratar no cliente.
- **Status:** resolvido com `entry-server.tsx`, build SSR e `scripts/prerender.mjs`.

### F2 — Intenções de serviço não possuíam URLs, metadata ou H1 próprios

- **Issue:** serviços e problemas distintos disputavam uma única home.
- **Category:** On-Page Optimization.
- **Evidence:** sitemap anterior tinha duas URLs; não havia roteador ou documentos de serviço; title/H1 da home cobriam todos os equipamentos juntos.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** limita a correspondência entre consulta, snippet, conteúdo e canonical.
- **Score Impact:** −10 pontos on-page antes da correção.
- **Recommendation:** criar documentos canônicos somente para intenções semanticamente distintas.
- **Status:** resolvido com 23 páginas específicas e o hub `/servicos`.

### F3 — Não existia arquitetura interna de clusters

- **Issue:** a home não conseguia distribuir relevância para hubs e páginas relacionadas inexistentes.
- **Category:** On-Page Optimization.
- **Evidence:** links anteriores apontavam apenas para âncoras da landing e WhatsApp.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** páginas importantes ficam sem caminho descritivo de descoberta e sem contexto temático.
- **Score Impact:** −10 pontos on-page antes da correção.
- **Recommendation:** ligar home → hub geral → hubs por equipamento → problemas relacionados.
- **Status:** resolvido; teste automatizado confirma zero páginas órfãs entre as 26 URLs indexáveis.

### F4 — Impressoras eram apresentadas como serviço atual

- **Issue:** home, FAQ, metadata e OfferCatalog afirmavam atendimento de impressoras após o encerramento do serviço.
- **Category:** Content Quality & E-E-A-T.
- **Evidence:** `src/utils/constants.ts` continha “Manutenção de Impressoras”; `index.html` citava impressora na description e no JSON-LD; FAQ respondia que o serviço era feito.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** informação comercial incorreta reduz confiança, pode gerar leads inadequados e confunde a entidade.
- **Score Impact:** −10 pontos de conteúdo antes da correção.
- **Recommendation:** remover das ofertas atuais sem excluir automaticamente uma eventual URL histórica.
- **Status:** resolvido; não existia URL indexável específica de impressora no repositório. O hub informa apenas, de forma explícita, que não é serviço atual.

### F5 — Conteúdo de serviço era raso para perguntas específicas

- **Issue:** cards curtos não explicavam sintomas, causas, diagnóstico, compatibilidade ou decisão de reparo.
- **Category:** Content Quality & E-E-A-T.
- **Evidence:** cada serviço possuía apenas uma descrição curta em `Services.tsx` e algumas respostas na FAQ geral.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** não satisfazia completamente intenções como “notebook não liga”, “tela preta” ou “drift”.
- **Score Impact:** −10 pontos de conteúdo antes da correção.
- **Recommendation:** publicar conteúdo people-first, específico e prudente para cada problema.
- **Status:** resolvido; cada documento específico possui pelo menos 450 palavras visíveis no HTML gerado e conteúdo próprio.

### F6 — `/inicio` não consolidava o resultado histórico

- **Issue:** a rota antiga respondia 404 apesar de ainda aparecer em um índice histórico.
- **Category:** Crawlability & Indexation.
- **Evidence:** `curl https://master-prime.com/inicio` retornou HTTP 404 em 11/08/2026; a busca ainda recuperava “Carregando... Aguarde, estamos redirecionando você”.
- **Severity:** Medium.
- **Confidence:** High.
- **Why It Matters:** sinais e visitas antigas não eram encaminhados para a URL canônica correspondente.
- **Score Impact:** −5 pontos de crawlability antes da correção.
- **Recommendation:** redirect permanente específico para `/`.
- **Status:** configurado em `vercel.json`; confirmar HTTP 301 após deploy.

### F7 — OAI-SearchBot não tinha regra explícita

- **Issue:** o bot era permitido pelo wildcard, mas a política solicitada não estava declarada de modo explícito.
- **Category:** Crawlability & Indexation.
- **Evidence:** `public/robots.txt` anterior possuía apenas `User-agent: *`.
- **Severity:** Low.
- **Confidence:** High.
- **Why It Matters:** a regra genérica já permitia acesso, mas uma diretiva explícita torna a intenção operacional inequívoca.
- **Score Impact:** −1 ponto de crawlability antes da correção.
- **Recommendation:** adicionar `OAI-SearchBot` preservando `/api/` bloqueada e sem alterar GPTBot.
- **Status:** resolvido.

### F8 — Entidade estruturada misturava varejo, áreas não reconfirmadas e serviço encerrado

- **Issue:** `ComputerStore`/OfferCatalog incluía impressoras e oito áreas atendidas não reconfirmadas nesta tarefa.
- **Category:** Authority & Trust Signals.
- **Evidence:** bloco JSON-LD anterior em `index.html`.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** dados estruturados devem reforçar apenas fatos atuais e verificáveis da entidade.
- **Score Impact:** −10 pontos de autoridade antes da correção.
- **Recommendation:** usar `LocalBusiness`, manter um `@id` estável e limitar serviços/área aos fatos confirmados.
- **Status:** resolvido; nenhuma propriedade de rating/review foi adicionada.

### F9 — JavaScript visual e analytics ainda exigem medição de campo

- **Issue:** a home carrega React, Framer Motion, canvas e integrações de GTM, Meta Pixel e Clarity sem dados de campo disponíveis para avaliar impacto.
- **Category:** Technical Foundations.
- **Evidence:** build final: React ~139 kB, Motion ~120 kB e aplicação ~175 kB antes de gzip; scripts externos permanecem no template.
- **Severity:** Medium.
- **Confidence:** Medium para impacto; alta para presença/peso.
- **Why It Matters:** pode afetar LCP/INP em aparelhos modestos, embora o efeito real exija CrUX ou RUM.
- **Score Impact:** −2,5 pontos técnicos após modificador de confiança.
- **Recommendation:** revisar CWV de campo e o contêiner GTM após deploy; não remover tags sem validar medição.
- **Status:** pendente de dados de campo.

### F10 — A landing page externa antiga ainda responde 200

- **Issue:** `lp.master-prime.com` continua publicando conteúdo, endereço e promessas antigos.
- **Category:** Authority & Trust Signals.
- **Evidence:** requisição HTTP e recuperação do conteúdo responderam 200 em 11/08/2026; busca ainda exibiu a LP.
- **Severity:** High.
- **Confidence:** High.
- **Why It Matters:** cria sinais comerciais conflitantes sob a marca e pode competir com o domínio principal.
- **Score Impact:** −10 pontos de autoridade no estado atual.
- **Recommendation:** concluir o redirect permanente no Cloudflare e monitorar a remoção da URL antiga do índice.
- **Status:** externo ao repositório; não resolvido aqui.

### F11 — Não há imagens reais de experiência nas novas páginas

- **Issue:** o repositório não contém fotos verificadas de bancada, reparos, peças ou equipe para as intenções novas.
- **Category:** Content Quality & E-E-A-T.
- **Evidence:** assets atuais são imagens de apresentação; nenhum arquivo foi fornecido como prova real de serviço.
- **Severity:** Medium.
- **Confidence:** High.
- **Why It Matters:** imagens originais podem demonstrar experiência e explicar processos de forma mais concreta.
- **Score Impact:** −5 pontos de conteúdo no estado atual.
- **Recommendation:** fotografar trabalhos reais com consentimento e inserir nos slots preparados, usando dimensões e alt text factuais.
- **Status:** arquitetura pronta em `ExperienceImage.tsx`; nenhum placeholder falso é renderizado.

### F12 — Imagem social é apenas o logo existente

- **Issue:** páginas usam o apple touch icon como `og:image`, não uma arte social 1200 × 630.
- **Category:** On-Page Optimization.
- **Evidence:** tags OG/Twitter do template apontam para `/apple-touch-icon.png`.
- **Severity:** Low.
- **Confidence:** High.
- **Why It Matters:** compartilhamentos podem ter apresentação menos informativa, embora isso não bloqueie indexação.
- **Score Impact:** −2 pontos on-page no estado atual.
- **Recommendation:** criar uma imagem social oficial e factual quando houver asset aprovado.
- **Status:** pendente; o logo foi preservado para não fabricar material visual.

## Plano de ação priorizado

### Critical blockers

Nenhum blocker crítico permaneceu no repositório. A configuração final não bloqueia páginas públicas, não usa `noindex` nas URLs canônicas e mantém 404 real fora das rotas geradas.

### High-impact improvements

- **F10:** concluir o 301 externo da LP antiga. Recuperação esperada: 8–10 pontos na categoria Authority & Trust.
- Revalidar **F6** depois do deploy para confirmar o 301 real de `/inicio`.

### Quick wins

- **F11:** adicionar fotos reais nos slots. Recuperação esperada: até 5 pontos em Content Quality & E-E-A-T.
- **F12:** publicar OG 1200 × 630 aprovada. Recuperação esperada: até 2 pontos on-page.
- Confirmar e usar o link direto atual do Perfil da Empresa para o CTA de avaliações.

### Longer-term opportunities

- **F9:** medir CWV/CrUX e revisar tags/JavaScript somente com dados reais. Recuperação potencial: até 2,5 pontos técnicos.
- Publicar estudos de caso reais, processo editorial e perfis de responsáveis técnicos apenas quando nomes, funções e credenciais forem fornecidos.
- Usar Search Console para avaliar impressões/consultas por cluster e ajustar conteúdo sem criar novas páginas sobrepostas.

## B) Arquitetura criada

```text
/
└── /servicos
    ├── /conserto-de-notebook-campo-grande-rj
    │   └── 9 páginas de problema/serviço
    ├── /conserto-de-computador-campo-grande-rj
    │   ├── 3 páginas de computador
    │   ├── /manutencao-de-pc-gamer
    │   └── /upgrade-de-pc-gamer
    ├── /conserto-de-celular-campo-grande-rj
    │   └── tela, bateria e placa
    ├── /conserto-de-videogame
    └── /conserto-de-controle
        └── /controle/correcao-de-drift-e-hall-effect
```

O mapa completo de URLs, keywords, variações, intenção e decisões de consolidação está em `SEO_KEYWORD_MAP.md`.

## C) URLs novas

### Hub

- `/servicos`

### Notebook

- `/conserto-de-notebook-campo-grande-rj`
- `/notebook/troca-de-tela`
- `/notebook/dobradica-e-carcaca`
- `/notebook/reparo-de-placa-mae`
- `/notebook/upgrade-ssd-e-memoria-ram`
- `/notebook/troca-de-teclado`
- `/notebook/nao-liga`
- `/notebook/liga-mas-nao-da-imagem`
- `/notebook/superaquecendo-e-desligando`
- `/notebook/limpeza-e-manutencao`

### Computador e PC gamer

- `/conserto-de-computador-campo-grande-rj`
- `/computador/nao-liga-ou-nao-da-imagem`
- `/computador/upgrade-ssd-e-memoria-ram`
- `/computador/limpeza-e-manutencao`
- `/manutencao-de-pc-gamer`
- `/upgrade-de-pc-gamer`

### Celular

- `/conserto-de-celular-campo-grande-rj`
- `/celular/troca-de-tela`
- `/celular/troca-de-bateria`
- `/celular/reparo-de-placa`

### Videogames e controles

- `/conserto-de-videogame`
- `/conserto-de-controle`
- `/controle/correcao-de-drift-e-hall-effect`

Total: 24 URLs novas; 26 URLs indexáveis contando home e política de privacidade.

## D) Intenção/search term de cada URL

O detalhamento está na tabela canônica de `SEO_KEYWORD_MAP.md`. Os termos foram agrupados por decisão real do cliente, sem volumes inventados. SSD/RAM, computador sem ligar/sem imagem e drift/Hall Effect foram consolidados para evitar canibalização; notebook sem ligar e notebook sem imagem permaneceram separados por terem fluxos diagnósticos e intenção distintos.

## E) Mudanças técnicas

- SSR de build com `react-dom/server` e pré-renderização das rotas em diretórios estáticos.
- Hidratação do HTML no cliente; desenvolvimento continua usando `createRoot` quando o template está vazio.
- Conteúdo principal agora está presente no HTML, inclusive home.
- Roteamento leve por pathname sem adicionar framework ou mudar o sistema visual.
- Componentes reutilizados: Footer, botões/cores/tipografia/spacing Tailwind e utilitários de WhatsApp.
- Novo header interno, hub, template de serviço, JSON-LD e slot de imagem real.
- Home passou a ligar diretamente para seis intenções principais e para o hub geral.
- Navegação do footer funciona tanto na home quanto em páginas internas.
- Build cliente mantém otimização de imagens e chunks; build SSR exclui otimização/cópia de assets desnecessária.

## F) Robots, sitemap, schema e redirects

- `robots.txt`: wildcard preservado, `/api/` bloqueada, `OAI-SearchBot` explicitamente permitido, GPTBot sem política adicionada.
- Sitemap gerado pela mesma lista de rotas usada no pré-render: 26 URLs canônicas.
- Entidade principal: `LocalBusiness` com `@id https://master-prime.com/#localbusiness`.
- Home: catálogo apenas de notebook, computador, PC gamer, celular, videogame e controle.
- Hub: `ItemList` e `BreadcrumbList`.
- Páginas específicas: `Service` com `provider` ligado ao LocalBusiness + `BreadcrumbList`.
- Sem `AggregateRating`, `Review` ou FAQ schema.
- Redirects 301 específicos: `/presell`, `/presell/`, `/presell/index.html`, `/inicio` e `/inicio/` → `/`.
- Catch-all continua ausente, preservando 404 real para URL desconhecida.

## G) Itens não confirmados

- Link direto e estado atual do Perfil da Empresa no Google; o site usa busca do Maps pelo endereço canônico.
- E-mail e horários foram preservados do repositório, mas devem ser reconfirmados com a empresa/GBP.
- O texto “mais de 600 avaliações no Google” foi fornecido na tarefa; não foi convertido em rating schema nem número exato dinâmico.
- Não foram confirmados preço, prazo, garantia, marcas autorizadas, certificações, número de técnicos ou peças específicas.
- Montagem/configuração de PC gamer não recebeu página própria.
- Não foram fornecidas fotos reais, nomes/credenciais de técnicos ou casos documentados.
- Não houve acesso a GSC, Analytics, Semrush autenticado, GBP, CrUX ou backlinks.

## E-E-A-T e conteúdo

### Scorecard pós-implementação

| Dimensão | Score | Evidência atual | Próximo ganho legítimo |
|---|---:|---|---|
| Experiência | 7/10 | Processo diagnóstico concreto, sintomas e limites | Fotos reais e casos documentados |
| Expertise | 8/10 | Diferenças técnicas por falha sem diagnóstico precipitado | Responsável técnico/credenciais confirmadas |
| Autoridade | 7/10 | Cluster completo, entidade consistente, mais de 600 avaliações informadas | LP externa redirecionada e citações locais consistentes |
| Confiança | 9/10 | NAP, contato, horários, privacy, linguagem prudente, sem promessas | Confirmar dados no GBP e link direto da ficha |

### Auditoria de conteúdo

| Categoria | Score | Resultado |
|---|---:|---|
| Profundidade | 9/10 | Todas as páginas específicas passam o piso automatizado de 450 palavras visíveis |
| E-E-A-T visível | 8/10 | Diagnóstico e limites fortes; falta prova visual original |
| Legibilidade | 9/10 | Resposta direta, listas, cards, passos e FAQs curtas |
| Otimização semântica | 9/10 | Uma intenção canônica por URL; termos relacionados naturais |
| Confiança | 9/10 | NAP/contato consistentes; sem preço, prazo ou garantia inventados |

## H) Riscos e QA manual restante

- Confirmar no deploy que todas as rotas de diretório respondem 200 sem redirect inesperado e que `/inicio` responde 301.
- Testar Rich Results/Schema Markup Validator após publicação; o teste local garante JSON válido e tipos/relações esperados, não elegibilidade de rich result.
- Fazer QA visual em navegadores reais, principalmente detalhes/FAQ, títulos longos e CTA mobile.
- Medir CWV de campo; Lighthouse local não substitui usuários reais.
- Concluir o redirect externo de `lp.master-prime.com` no Cloudflare.
- Inserir somente fotos reais aprovadas nos slots preparados.
- Monitorar queries por cluster no Search Console antes de subdividir ou consolidar novas intenções.

## I) Comandos e testes executados

| Comando/verificação | Resultado |
|---|---|
| `npm run lint` | PASS, zero warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; 25 páginas React pré-renderizadas + política; 26 URLs no sitemap |
| `npm test` | PASS após o build final; metadata, H1, canonical, JSON-LD, conteúdo, órfãs, links, sitemap, robots, redirects, NAP e impressoras |
| Skill `quick_validate.py` | PASS |
| `curl` no domínio publicado | Home/robots/sitemap/policy 200; `/presell` 301; `/inicio` e URL inexistente 404 antes do deploy; LP externa 200 |
| Pesquisa web PT-BR | Executada sem declarar volume/CPC/dificuldade |
| `git diff --check` | PASS |

## J) Arquivos modificados

### Regras e documentação

- `AGENTS.md`
- `.agents/skills/master-prime-local-seo/SKILL.md`
- `.agents/skills/master-prime-local-seo/agents/openai.yaml`
- `SEO_AUDIT.md`
- `SEO_KEYWORD_MAP.md`
- `README.md`

### Dados, páginas e SEO

- `src/data/seo-pages.json`
- `src/types/seo.ts`
- `src/utils/seo.ts`
- `src/components/pages/ServicePage.tsx`
- `src/components/pages/ServicesHub.tsx`
- `src/components/seo/JsonLd.tsx`
- `src/components/seo/ExperienceImage.tsx`
- `src/components/layout/InnerHeader.tsx`

### Aplicação existente

- `src/App.tsx`
- `src/main.tsx`
- `src/entry-server.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Services.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/layout/Footer.tsx`
- `src/utils/constants.ts`

### Build, descoberta e validação

- `package.json`
- `vite.config.ts`
- `scripts/prerender.mjs`
- `scripts/validate-seo.mjs`
- `index.html`
- `public/robots.txt`
- `public/sitemap.xml`
- `vercel.json`

Nenhum deploy, commit ou alteração no Cloudflare/GBP foi executado.
