# Internal linking e prioridade de rastreamento — Master Prime

Data: 15/10/2026. Registro da auditoria anterior à publicação. Escopo de implementação: `/`, `/servicos` e `/conserto-de-videogame`.

## Resultado

Foram adicionadas 11 ocorrências de links: seis na seção “Problemas e serviços que atendemos”, junto aos sintomas da página-pai; três no contexto de videogames em `/servicos`; duas no card de consoles da home. Todos são elementos `<a href>` pré-renderizados, visíveis sem JavaScript, sem `nofollow`, accordion ou interação necessária para existir.

Os links anteriores de “Serviços relacionados” foram preservados. Os seis novos links na página-pai reforçam a localização e a clareza dos caminhos existentes; não representam seis novas páginas de origem. Os três links de `/servicos` e os dois da home acrescentam cinco relações entre origem e destino.

Nenhuma URL, slug, metadata, canonical, schema, breadcrumb, informação comercial, CTA, configuração de robots, sitemap ou estilo global foi alterado. O HTML principal das outras 29 URLs permanece idêntico ao publicado antes desta alteração, incluindo as seis páginas-filhas.

## Links adicionados e confirmação no HTML

Destinos relativos ao domínio `https://master-prime.com`. “Sim” significa confirmado no corpo HTML recebido por HTTP, antes da execução de JavaScript, e visível no Chromium com JavaScript desabilitado.

| Página origem | Anchor text exato | Página destino | Tipo/contexto | Aparece no HTML |
| --- | --- | --- | --- | --- |
| `/conserto-de-videogame` | PS4 não liga | `/videogame/ps4-nao-liga` | Navegação por sintomas junto à avaliação de consoles | Sim |
| `/conserto-de-videogame` | PS4 liga e desliga | `/videogame/ps4-liga-e-desliga` | Navegação por sintomas junto à avaliação de consoles | Sim |
| `/conserto-de-videogame` | PS4 sem imagem | `/videogame/ps4-sem-imagem` | Navegação por sintomas junto à avaliação de consoles | Sim |
| `/conserto-de-videogame` | Limpeza e manutenção de PS4 | `/videogame/limpeza-e-manutencao-ps4` | Navegação por serviço e modelo | Sim |
| `/conserto-de-videogame` | PS5 sem imagem | `/videogame/ps5-sem-imagem` | Navegação por sintomas junto à avaliação de consoles | Sim |
| `/conserto-de-videogame` | Limpeza e manutenção de PS5 | `/videogame/limpeza-e-manutencao-ps5` | Navegação por serviço e modelo | Sim |
| `/servicos` | PS4 não liga | `/videogame/ps4-nao-liga` | Texto sobre falhas de energia ou vídeo em “Videogames e controles” | Sim |
| `/servicos` | PS5 sem imagem | `/videogame/ps5-sem-imagem` | Texto sobre falhas de energia ou vídeo em “Videogames e controles” | Sim |
| `/servicos` | limpeza e manutenção de PS5 | `/videogame/limpeza-e-manutencao-ps5` | Texto sobre poeira, ruído e aquecimento em “Videogames e controles” | Sim |
| `/` | PS4 não liga | `/videogame/ps4-nao-liga` | Texto contextual no card “Videogames e Consoles” | Sim |
| `/` | PS5 sem imagem | `/videogame/ps5-sem-imagem` | Texto contextual no card “Videogames e Consoles” | Sim |

## Retornos e relações existentes preservados

| Página origem | Anchor text | Página destino | Tipo/contexto | Aparece no HTML |
| --- | --- | --- | --- | --- |
| `/videogame/ps4-nao-liga` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |
| `/videogame/ps4-liga-e-desliga` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |
| `/videogame/ps4-sem-imagem` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |
| `/videogame/limpeza-e-manutencao-ps4` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |
| `/videogame/ps5-sem-imagem` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |
| `/videogame/limpeza-e-manutencao-ps5` | Conserto de videogame | `/conserto-de-videogame` | Breadcrumb; também há retorno no conteúdo principal | Sim |

As relações laterais `/videogame/ps4-sem-imagem` → `/videogame/ps4-nao-liga` e `/videogame/ps4-nao-liga` → `/videogame/ps4-liga-e-desliga` já existem nos cards de serviços relacionados e continuam no HTML. Nenhuma ligação lateral nova foi necessária neste ciclo. Não foi adicionada uma relação automática de falta de imagem com limpeza de PS5, pois esses sintomas não estabelecem, por si só, indicação de limpeza.

## Auditoria de descoberta interna

O contexto fornecido informa 20 URLs em “Detectada, mas não indexada”, incluindo as seis de videogame, e a página-pai de videogame indexada. Não foi fornecida a relação individual das outras 14 URLs nem há acesso autenticado ao Search Console nesta sessão. A auditoria cobre todas as 32 URLs do sitemap para não omitir essas páginas, mas não atribui status de indexação individual às demais. Quantidade de links não demonstra indexação ou frequência de crawl.

Método: leitura HTTP do sitemap e dos 32 documentos publicados antes da edição; comparação com o build servido localmente após a edição. Contagem de URLs de origem distintas com links dentro de `<main>`, excluindo autorreferências, breadcrumb/navegação, header, footer e conteúdo em `<details>`. Links repetidos da mesma origem contam uma vez. Profundidade é o menor número de links nesse conjunto partindo da home; não é uma estimativa da agenda do Googlebot. “Poucas origens” é uma triagem relativa deste site, sem limiar universal do Google.

| URL | Origens relevantes antes → depois | Profundidade antes → depois |
| --- | --- | --- |
| `/` | 1 → 1 | 0 → 0 |
| `/servicos` | 1 → 1 | 1 → 1 |
| `/conserto-de-notebook-campo-grande-rj` | 11 → 11 | 1 → 1 |
| `/notebook/troca-de-tela` | 4 → 4 | 2 → 2 |
| `/notebook/dobradica-e-carcaca` | 4 → 4 | 2 → 2 |
| `/notebook/reparo-de-placa-mae` | 4 → 4 | 2 → 2 |
| `/notebook/upgrade-ssd-e-memoria-ram` | 4 → 4 | 2 → 2 |
| `/notebook/troca-de-teclado` | 2 → 2 | 2 → 2 |
| `/notebook/nao-liga` | 5 → 5 | 2 → 2 |
| `/notebook/liga-mas-nao-da-imagem` | 4 → 4 | 2 → 2 |
| `/notebook/superaquecendo-e-desligando` | 3 → 3 | 2 → 2 |
| `/notebook/limpeza-e-manutencao` | 3 → 3 | 2 → 2 |
| `/conserto-de-computador-campo-grande-rj` | 7 → 7 | 1 → 1 |
| `/computador/nao-liga-ou-nao-da-imagem` | 4 → 4 | 2 → 2 |
| `/computador/upgrade-ssd-e-memoria-ram` | 4 → 4 | 2 → 2 |
| `/computador/limpeza-e-manutencao` | 4 → 4 | 2 → 2 |
| `/manutencao-de-pc-gamer` | 6 → 6 | 2 → 2 |
| `/upgrade-de-pc-gamer` | 4 → 4 | 1 → 1 |
| `/conserto-de-celular-campo-grande-rj` | 5 → 5 | 1 → 1 |
| `/celular/troca-de-tela` | 4 → 4 | 2 → 2 |
| `/celular/troca-de-bateria` | 4 → 4 | 2 → 2 |
| `/celular/reparo-de-placa` | 4 → 4 | 2 → 2 |
| `/conserto-de-videogame` | 10 → 10 | 1 → 1 |
| `/videogame/ps4-nao-liga` | 3 → 5 | 2 → 1 |
| `/videogame/ps4-liga-e-desliga` | 4 → 4 | 2 → 2 |
| `/videogame/ps4-sem-imagem` | 2 → 2 | 2 → 2 |
| `/videogame/limpeza-e-manutencao-ps4` | 2 → 2 | 2 → 2 |
| `/videogame/ps5-sem-imagem` | 1 → 3 | 2 → 1 |
| `/videogame/limpeza-e-manutencao-ps5` | 1 → 2 | 2 → 2 |
| `/conserto-de-controle` | 4 → 4 | 1 → 1 |
| `/controle/correcao-de-drift-e-hall-effect` | 3 → 3 | 2 → 2 |
| `/politica-de-privacidade` | 0 → 0 | — |

Nenhuma página de serviço está órfã ou sem origem relevante. A política de privacidade recebe links no footer e, portanto, aparece com zero apenas no recorte de conteúdo principal usado nesta tabela.

As páginas de PS5 eram as menos conectadas entre os serviços, com uma origem cada: `/conserto-de-videogame`. Após o ajuste, PS5 sem imagem recebe links também da home e de `/servicos`, e limpeza de PS5 recebe também de `/servicos`. PS4 não liga passa a receber links dessas mesmas duas origens adicionais. Os demais três destinos prioritários de PS4 ganham destaque junto aos sintomas da página-pai, mantendo suas origens anteriores.

## Oportunidades adicionais, sem implementação automática

Estas são oportunidades no conjunto auditado, sem afirmar que cada URL integra as 20 pendentes do Search Console. A origem sugerida em todos os casos é `/conserto-de-notebook-campo-grande-rj`, cujo conteúdo já menciona esses sintomas e serviços, mas não aponta diretamente para esses destinos.

| Destino existente | Origens relevantes atuais | Contexto existente para um futuro link |
| --- | --- | --- |
| `/notebook/troca-de-teclado` | 2: `/servicos` e `/notebook/dobradica-e-carcaca` | Menção a “teclado com falhas” ou explicação de compatibilidade de teclado; maior oportunidade de pouca ligação fora de videogames |
| `/notebook/superaquecendo-e-desligando` | 3 | Lista de sintomas: ruído de ventilação, aquecimento e desligamentos |
| `/notebook/limpeza-e-manutencao` | 3 | Lista de sintomas: limpeza interna e manutenção preventiva |
| `/notebook/liga-mas-nao-da-imagem` | 4 | Sintoma: equipamento liga, acende LEDs, mas fica sem imagem |
| `/notebook/reparo-de-placa-mae` | 4 | Explicação de possíveis causas envolvendo circuito da placa, sem presumir diagnóstico |

As duas últimas já têm quatro origens; a oportunidade é a ligação temática direta do hub, não ausência de descoberta. Não foram feitas edições nessas páginas.

## Validações executadas

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | Aprovado, zero warnings do ESLint |
| `npm run typecheck` | Aprovado como primeira etapa de `npm run build` |
| `npm run build` | Aprovado; 31 páginas React pré-renderizadas + política; 32 URLs no sitemap |
| `npm test` | Aprovado; metadata, H1, canonical, JSON-LD, sitemap, robots, redirects, links internos, órfãs, NAP e referências a impressoras |
| `git diff --check` | Aprovado |
| HTTP antes da edição, domínio publicado | 32/32 URLs retornam 200 sem redirecionamento; URL inexistente retorna 404 |
| HTTP depois da edição, build servido localmente | 32/32 URLs retornam 200 sem redirecionamento; todos os 32 destinos internos distintos de links retornam 200; URL inexistente retorna 404 |
| Canonical, indexabilidade e metadata | Canonical própria, um title, description e H1 por página; ausência de `noindex` em meta e headers HTTP; metadata preservada |
| Conteúdo e entidade | JSON-LD válido e idêntico ao publicado; `LocalBusiness`, NAP, `Service.provider`, breadcrumbs e links de WhatsApp preservados |
| Sitemap e robots | Sem alteração no Git; arquivos gerados iguais aos de origem; robots publicado idêntico ao repositório |
| Acesso de robôs | Googlebot e OAI-SearchBot permitidos nas 32 URLs; bloqueio de `/api/` preservado; política de GPTBot sem alteração |
| HTML dos novos links | 11/11 presentes na resposta HTTP, sem `nofollow` nem ancestrais ocultos/accordion/template |
| Retorno das páginas-filhas | 6/6 com link de breadcrumb e link no conteúdo principal para `/conserto-de-videogame` |
| Browser e responsividade | Chromium em 390 e 1440 px, nas três páginas alteradas, com e sem JavaScript: 12 combinações aprovadas; links visíveis, sem overflow horizontal nem exceções de runtime; screenshots revisados |

O build informou apenas a recomendação existente de atualizar a base Browserslist. Nenhuma dependência foi alterada neste escopo.

O servidor local de QA entrega os HTMLs do diretório `dist`, sem fallback de SPA. Ele valida o artefato construído; os links novos ainda não foram verificados em uma publicação de produção. Os resultados HTTP do domínio oficial acima descrevem o estado anterior à edição.

## Arquivos alterados e acompanhamento

- `src/components/pages/ServicePage.tsx`: seção condicional somente no hub de videogame.
- `src/components/pages/ServicesHub.tsx`: três links no contexto de videogames e controles.
- `src/components/sections/Services.tsx`: dois links no card de consoles da home.
- `SEO_INTERNAL_LINKING_AUDIT.md`: evidências, mapa de links e oportunidades.

Após a publicação, confirmar as 11 novas ocorrências no HTML de produção e acompanhar “Último rastreamento” e evolução das seis URLs na inspeção do Search Console. O contexto de indexação da home e de `/servicos` não foi confirmado individualmente nesta sessão; apenas o hub de videogame foi informado como indexado. A alteração facilita caminhos de descoberta e reforça o contexto interno, sem garantir prazo de crawl ou indexação.

## QA final antes da publicação — 15/10/2026

Toda a validação foi executada novamente: lint, typecheck, build, testes, auditoria HTTP das 32 URLs, 11 novos links e seis retornos ao hub. O baseline foi atualizado diretamente da produção. Metadata, JSON-LD, breadcrumbs e WhatsApp foram comparados com esse baseline; o HTML principal das outras 29 URLs permanece idêntico. Os testes em Chromium passaram nas 12 combinações de página, largura (390/1440 px) e JavaScript ativado/desativado, incluindo a coleta de exceções e erros relevantes de console. Screenshots revisados.

Diff final: somente adições de internal linking nos três componentes descritos acima; o único arquivo adicional é este relatório. Nenhuma dependência, configuração, URL, conteúdo anterior ou estilo global foi alterado. Gate de publicação aprovado. Fluxo de produção confirmado pelo histórico de deployments: push na branch `main`, integrada à Vercel.
