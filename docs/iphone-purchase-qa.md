> Atualização Clarity de 23/10/2026: a ausência de Clarity descrita nas execuções históricas abaixo foi substituída pelo carregamento do projeto existente `v6kk9ke9ye`, mantendo GTM bloqueado e máscaras. Ver a seção final específica; nenhuma mudança no tracker faz parte desta contribuição.

> Estado atual: jornada reduzida `2026-10-21.reduced-v1`, descrita na seção final. As seções anteriores registram os testes das versões históricas, incluindo a triagem removida.

# QA — orçamento de compra de iPhone

Execução local em 21/10/2026. Commit e push autorizados pelo usuário; deploy ainda não confirmado por este relatório. Catálogo comercial `2026-10-21.v2`.

## Resultado

- `npm run lint`: passou, sem warnings.
- `npm run typecheck`: passou; também integra `npm run build`.
- `npm run build`: passou, incluindo cliente, SSR e pré-renderização de 37 páginas React; 38 URLs no sitemap contando privacidade.
- `npm test`: passaram **108 testes** dos fluxos de notebook, videogame, celular/reparo, rastreamento do reparo, computador, PC e compra de iPhone, incluindo preservação das imagens, além da auditoria SEO.
- `npm run test:iphone-purchase`: 30 testes específicos de catálogo/regras/restauração/tracking/privacidade.
- QA de navegador: passou em Chromium 152.0.7977.64; teste adicional de hidratação e compra sem troca em WebKit 375×667. Não são aparelhos físicos.
- `git diff --check`: passou.

A auditoria SEO cobre links internos e páginas órfãs, title/description únicos, H1 único, canonical, sitemap, robots, JSON-LD, NAP, redirecionamentos existentes e referências indevidas a impressoras. A nova rota tem verificações próprias de preços à vista/parcelas pré-renderizados (sem total na etapa 1), catálogo rastreável, breadcrumb e remoção de transportes noscript. Ela não altera robots, GPTBot, telefones, e-mail, horários ou URLs existentes.

O build informa que a base caniuse-lite/Browserslist já existente está desatualizada. Não foi feita atualização de dependências fora do escopo.

## Casos verificados

| Área | Evidência |
| --- | --- |
| Tabela | 22 variantes comparadas aos valores fornecidos; acréscimo único de 8,57% confirmado pela empresa; cálculos em centavos, total fixo de 2× a 12× e ajuste informado na última parcela |
| Entrada | Link direto 17/256; 512 GB; entrada genérica; parâmetros inválidos e tentativas de preço/crédito por URL ignorados; nenhuma cor selecionada automaticamente |
| Seleção | Capacidade/cor/modelo/condição compatíveis preservados, incompatíveis eliminados; seminovo 15 Pro 256 GB com preço correto |
| Compra sem troca | Cinco etapas; resumo sem bloco vazio de usado; sem cadastro ou perguntas técnicas |
| Triagem | Modelo elegível reconhecido; modelo anterior incompatível; esclarecimento de desconhecido; política pendente para outros produtos; continuação sem troca |
| Bateria/histórico | Não sei válido; zero/100 válidos, valores negativos/acima de 100/decimais inválidos; histórico e falhas condicionais; notas limitadas e respostas ocultas limpas |
| Revisão | Aparelho desejado e usado separados, edição de cada bloco, pagamento/prazo, aviso técnico sem crédito ou saldo |
| Rascunho | Expiração, dados malformados, restauração de campos e posição, revalidação de seleção, alteração/remoção/indisponibilidade no catálogo |
| Atualização comercial | Tabela diferente retorna ao produto com aviso persistente em reload; exige reconhecimento antes de avançar; nunca usa preço salvo na mensagem |
| Origem | Seis UTMs/IDs validados, placeholders rejeitados, produto inicial separado do final, retorno sem UTM preserva origem; outra campanha/anúncio inicia tentativa própria |
| Marcos | Um evento por tentativa/tela, incluindo voltar/editar/revisar/recarregar/reabrir; triagem desconhecida/pendente não emite conclusão |
| Telemetria | Payload explícito sem notas, bateria, reparos, conta, nome, telefone, mensagem ou URL de WhatsApp; preços vêm do catálogo; nenhum `value`, Lead ou Purchase |
| Tags globais | Simulação do template confirma um Pixel existente, autoConfig desativado na compra, GTM/Clarity ausentes nela e preservados no reparo; URL livre limpa antes dos transportes |
| Falhas | Storage bloqueado, Pixel ausente/lançando erro em testes isolados, dataLayer lançando erro, clipboard recusado e ausência de rede não bloqueiam o preenchimento |
| WhatsApp/cópia | Destino confirmado igual ao orçamento de celular; abertura interceptada duas vezes e um evento de intenção; nenhuma mensagem enviada; fallback selecionável ao falhar clipboard |
| Mobile | 320×568 e 390×844 sem overflow horizontal; WebKit 375×667; desktop 1440×1000; controles medidos de pelo menos 48 px; texto a 200% sem overflow |
| Teclado/acessibilidade | Navegação por Tab e skip link; foco em erro de cor; labels/fieldset/aria; simulação de visualViewport oculta ações fixas durante digitação e as restaura ao fechar |
| Regressão | Suítes dos cinco orçamentos anteriores e eventos SmartphoneQuote passam; nenhuma renomeação dos eventos de reparo nem uso de sua conversão para venda |

## Medidas locais e evidências

O relatório de navegador registra medidas locais com cache/CPU/rede da máquina e terceiros interceptados. Não são medidas de campo, Core Web Vitals de produção ou promessa de desempenho em rede móvel. Os GLBs são carregados apenas na visualização 3D de lacrados; os seminovos não baixam modelos ou o runtime 3D. Referências seminovas preservam os pixels originais por WebP sem perdas.

O relatório de navegador registra zero erros de console/hidratação, zero controles visíveis abaixo de 48 px na tela inicial e ausência de rolagem horizontal. Os arquivos são regenerados em diretório ignorado pelo Git:

- `.cache/iphone-purchase-qa/report.json`
- `.cache/iphone-purchase-qa/mobile-product.png`
- `.cache/iphone-purchase-qa/mobile-review.png`
- `.cache/iphone-purchase-qa/mobile-copy-fallback.png`
- `.cache/iphone-purchase-qa/trade-review.png`
- `.cache/iphone-purchase-qa/desktop-product.png`
- `.cache/iphone-purchase-qa/desktop-review.png`

Foi encontrado durante QA um registro ausente da rota no servidor de preview, que fazia o HTML da home ser hidratado como compra. A inclusão em `vite.config.ts` corrigiu a causa; o cenário é coberto pelo teste real no preview do build. Não houve supressão de erros do React.

## Reprodução

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
```

Com uma instalação local de Playwright disponível, rodar:

```sh
npm run test:iphone-purchase-browser
```

Se Playwright estiver fora deste projeto, definir `PLAYWRIGHT_MODULE` com o caminho absoluto para seu `index.mjs`. O script aceita `PLAYWRIGHT_CHROMIUM_EXECUTABLE` e `PLAYWRIGHT_WEBKIT_EXECUTABLE` para executáveis locais existentes, além de `IPHONE_QA_URL` (padrão `http://127.0.0.1:4178`) e `IPHONE_QA_CONFIGURED_URL` (por padrão usa o mesmo preview). Ele recusa hosts externos, intercepta rede de terceiros, Pixel, clipboard e `window.open` antes do carregamento. O destino real confirmado é validado somente como URL interceptada, sem abertura externa.

QA não comprova recebimento de evento na Meta, entrega de mensagem nem envio real. Nenhum endpoint `/api/meta-lead` é usado por esta jornada. Campanhas, conversões, públicos e tags externas não foram criados ou alterados na conta.

## Arquivos entregues

Novos: `src/data/iphone-purchase.ts`, `src/types/iphone-purchase.ts`, `src/utils/iphone-purchase.ts`, `src/utils/iphone-purchase-tracking.ts`, `src/components/pages/IPhonePurchaseQuotePage.tsx`, `src/components/quote/IPhonePurchaseFields.tsx`, `src/styles/iphone-purchase.css`, os dois scripts `test-iphone-purchase*` e os três documentos `orcamento-iphone.md`, `iphone-purchase-qa.md`, `iphone-purchase-handoff-meta-ads.md`.

Integrados: `src/App.tsx`, `src/utils/seo.ts`, `src/components/quote/QuoteUI.tsx`, `src/components/sections/QuoteEntry.tsx`, `index.html`, `vite.config.ts`, `scripts/prerender.mjs`, `scripts/validate-seo.mjs`, `public/sitemap.xml`, `package.json` e a exportação da constante de telefone em `src/utils/whatsapp.ts`.

## Pendências para publicação

O WhatsApp de vendas está confirmado pelo usuário como o mesmo do orçamento de celular. Confirmar a tabela vigente. Manter sem promessa de garantia/acessórios/nota fiscal/entrega/estoque individual enquanto essas condições não forem fornecidas. Política de troca dos demais produtos pendente. Requer autorização específica para publicação/push com deploy.

Ainda não feitos: testes em iPhone/Android físicos, navegador interno real de Instagram/Facebook, VoiceOver/TalkBack reais, performance em aparelho de entrada e validação externa de consentimento/transporte/recebimento na Meta. WebKit local e simulação de teclado não substituem essas verificações. Não foi criado novo backend, upload, painel, CRM ou serviço pago.


## Revisão de UX solicitada pelo usuário

- Etapa inicial: apenas preço à vista e 12× por variante; totais permanecem na revisão/mensagem.
- Pagamento: À vista → Pix/Cartão, ou Cartão de crédito → 2 a 12 parcelas com valores visíveis e acréscimo único de 8,57%. Sem decidir no WhatsApp e sem boleto.
- Prazo de compra: etapa própria, obrigatória, sem Prefiro não informar. Revisão permite editá-lo separadamente.
- Usado: seletor de cor declarada, com Outra cor/Não sei.
- Destino final: mesmo número de celular/reparo, `5521967635340`, importado de constante compartilhada.
- Novos testes cobrem detalhes de pagamento obrigatórios, limpeza ao trocar pagamento, rejeição das opções antigas, restauração de rascunhos sem os novos requisitos, etapa `timing` e cor restrita à lista.

## Refinamento de imagem/3D — 21/10/2026

O 3D passa a ser a apresentação inicial por preferência posterior do usuário, com a composição estática como poster. Em navegadores que informam economia de dados, conexão 3G ou inferior, memória de até 2GB ou até duas threads de CPU, a entrada fica nas fotos, sem baixar o runtime/modelo; o visitante ainda pode ativar 3D. Ausência de WebGL2 mantém o poster e o formulário. A geometria Pro compartilhada foi autorizada para esta apresentação Pro Max; não representa foto de unidade real.

Modelo de 2,76MB, três acabamentos, presets, zoom limitado, sem rotação contínua. O script adicional `npm run test:iphone-media-browser` cobre download automático/adaptativo, mudança rápida de cor/vista, preservação da câmera, carregamento lento, imagem quebrada e retry, falha de modelo, ausência de WebGL, navegação entre etapas e toque emulado (rolagem vertical e rotação horizontal). Evidências e logs em `.cache/iphone-refine/`; o desenho e o resultado da revisão independente estão em `docs/iphone-product-design.md`.

Validações estáticas atuais: lint, typecheck, build e 108 testes de domínio/tracking/imagens, além da auditoria de 38 URLs indexáveis (links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e impressoras). O teste de mídia mede 320px, 390px, tablet, desktop e texto a 200%. Em 390×844, capacidade termina em aproximadamente 552px e a barra começa em 746px na entrada. Em alturas menores, as opções precisam de rolagem.

O WebKit local exercita a jornada sem troca; não equivale a Safari físico nem ao navegador interno real da Meta. Safe areas e teclado real continuam como aceitação em dispositivo. O teste de teclado automatizado é uma simulação de viewport, não prova de hardware. As mensagens continuam interceptadas: nenhum envio de WhatsApp ou evento real é comprovado por QA.

## Política de segurança da produção

O teste `npm run test:iphone-csp-browser` aplica o cabeçalho real de `vercel.json` ao documento local e exige que os dois modelos 3D carreguem sem violações de CSP ou erros de JavaScript. A revisão encontrou bloqueios de texturas GLB internas por `connect-src` e da inicialização WebAssembly do decoder incluído no model-viewer. O cabeçalho permite `blob:` em `connect-src` e `wasm-unsafe-eval` em `script-src`, preservando as demais diretivas. Não foi habilitado `unsafe-eval` de JavaScript.

Os testes de WebKit devem usar uma porta aceita pelo navegador, como 4178 ou 4189; 4190 é uma porta de rede restrita nesse runtime. Os logs da revisão final ficam em `.cache/iphone-final-check/`.

## Revisão antes do commit 1f512da — 21/10/2026

Lint, typecheck, build, 106 testes e auditoria SEO de 38 URLs passaram novamente. As sete suítes de navegador passaram contra uma cópia estável do build: catálogo, compra, mídia/3D do 17, 18 Pro Max, seminovos, troca e CSP de produção. A suíte de compra também passou em WebKit 375×667. Seminovos cobrem 13 ofertas e 58 cores; a triagem cobre compras do 17, 18 e seminovo com revisão, restauração, edição e resumo de WhatsApp. Nenhum teste envia mensagem ou evento externo.

## Ajuste de atribuição fbclid — 21/10/2026

Pedido de origem: `/home/wayne/master-prime-meta-ads/planejamento/iphone/AJUSTE-ATRIBUICAO-FBCLID.md`. O identificador recebido permanece íntegro na URL sanitizada e na navegação catálogo/configurador, sem geração de cookies pelo site nem inclusão em payload personalizado, rascunho ou WhatsApp. Produto e seis UTMs/IDs mantêm as mesmas regras.

Lint, typecheck, build, 108 testes e auditoria SEO de 38 URLs passaram. Contra uma cópia estável do build, passaram as suítes de catálogo, compra (Chromium e WebKit) e a nova `npm run test:iphone-attribution-browser`. Esta cobre seis cenários: navegação e href para nova aba; Pixel liberado depois de completar o formulário; leitura adiada por consentimento simulado; Pixel/storage bloqueados; ausência de fbclid; valor inválido com query privada. Casos sem bloqueio de storage também revalidam restauração e deduplicação após reload. As suítes dos reparos e seus eventos passaram em `npm test`.

Relatórios e logs locais: `.cache/iphone-fbclid/`. O script Meta é substituído por um observador, que lê a URL após liberação; não é o SDK real. Os testes não criam `_fbc`, não contornam consentimento e não comprovam transporte/recebimento na Meta ou GA4. GTM/Clarity continuam ausentes na compra, e os sete eventos permanecem com o contrato anterior. A estratégia e os limites estão no handoff de mídia.

## Jornada reduzida para teste de aquisição — 21/10/2026

Pedido: `PROMPT-SIMPLIFICAR-SITE-PARA-TESTE.md`. Jornada `2026-10-21.reduced-v1`: **Seu iPhone → Pagamento → Revisar → WhatsApp**. Removidas as perguntas de prazo, oferta de usado e descrição técnica. Revisão/mensagem contêm somente produto, capacidade, condição, cores/preferências, valores do catálogo, pagamento e confirmação de preço/disponibilidade. Abertura exata: “Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.” Não são criadas respostas presumidas para as informações não coletadas.

O rascunho usa `draft.version=2`, mantendo a chave existente para migração de v1. Restauração reaproveita apenas escolhas atuais válidas e apaga prazo/dados do usado. Telas removidas vão para Revisar ou para a primeira etapa atual incompleta. Origem, tentativa e marcos compatíveis permanecem; antigos marcos/eventos de triagem são descartados, sem StepCompleted retroativo. A nova propriedade `quote_journey_version` diferencia o fluxo; os cinco nomes aplicáveis e a semântica de intenção do WhatsApp são preservados.

Validação contra o build de produção:

- Lint, typecheck (incluído no build), build cliente/SSR e pré-renderização concluídos; **103 testes passaram**, zero falhas. O total substitui os testes da triagem removida por migração e jornada atual, sem manter asserções das etapas excluídas.
- Auditoria SEO: **38 URLs indexáveis**, links internos, title/description/H1/canonical, sitemap, robots, JSON-LD, NAP e referências a impressoras; regressão dos demais orçamentos e dos eventos SmartphoneQuote passou em `npm test`.
- Compra: link direto 17 Pro Max 256 lacrado, cor explícita, pagamento Pix/Cartão à vista e crédito 2–12, validação, edição/volta, revisão, cópia/fallback, abertura/reabertura interceptadas, catálogo alterado, storage bloqueado, offline, deduplicação, 320px, texto 200% e WebKit 375×667.
- Catálogo: links de modelos/condições, filtros, retorno, refresh/back/forward, link compartilhado canônico e ausência de parâmetros privados.
- Atribuição: seis cenários com Pixel observado/substituído, incluindo carregamento lento, consentimento simulado, bloqueio de Pixel/storage, ausência/invalidade de fbclid; preservação da caixa e do valor no catálogo/configurador/retorno e exclusão de payload próprio, storage, compartilhamento e WhatsApp.
- Migração: `npm run test:iphone-migration-browser` substitui a antiga suíte de triagem. **21 casos** (17 Pro Max, 18 Pro Max e seminovo, nas cinco telas removidas, revisão já emitida e pagamento incompleto), com descarte de respostas, preservação de marcos/origem, ausência de eventos removidos, cópia/abertura e reload sem duplicação. Testes unitários também cobrem produto inválido, expiração e preferências em todas as 22 variantes.
- Mídia: regressões de 17/18 Pro Max, imagens, controles 3D/CSP, todas as cores do 18 e 13 ofertas/58 renders de seminovos; preferências, totais de parcelamento e resumo na jornada reduzida.
- Revisão visual conferida em 390px e 1440px: progresso 3/3, dois blocos de revisão, ação do WhatsApp e ausência de overflow.

Comandos: `npm run lint`, `npm run build`, `npm test` e as oito suítes `test:iphone-{purchase,catalog,attribution,migration,used,18,csp,media}-browser`. Ambiente Playwright/Chrome local; evidências da rodada em `.cache/iphone-reduced/`, com relatórios auxiliares nos diretórios próprios das suítes.

Todos os testes bloqueiam rede externa e interceptam a abertura de WhatsApp. Não enviam eventos reais nem mensagens comerciais fictícias. O observador de Meta valida disponibilidade da URL/contrato e chamada de transporte, não o SDK real, entrega ou recebimento na Meta/GA4. Validação real de consentimento, conversão e identificação da conversa permanece com a mídia; nenhuma campanha/conversão foi alterada.

Commit, push e deploy estão autorizados. O hash e o resultado final de publicação serão informados na entrega após verificação da Vercel e da jornada pública com transports externos bloqueados.


## Reativação isolada do Clarity — 23/10/2026

O projeto existente `v6kk9ke9ye` volta a carregar em catálogo e configurador. GTM continua ausente; `autoConfig=false` do Pixel precede init. O formulário inteiro recebeu `clarity-mask` e `data-clarity-mask="true"`, preservando também a máscara interna da revisão/textarea. A rota não coleta nome, telefone nem notas livres; URL e hash privados são limpos antes dos transportes. Nenhum identify, evento ou tag personalizada de Clarity foi acrescentado.

A CSP adicional de `/orcamento/iphone/:path*`, complementada pela regra literal `/orcamento/iphone/`, permite `scripts.clarity.ms` em script-src e `c.clarity.ms` em img-src; connect-src já permite os coletores Clarity. A política global e os demais transportes ficam preservados. Pré-renderização continua removendo noscript de GTM/Pixel na compra; Clarity não possui esse fallback.

`node scripts/test-iphone-clarity-browser.mjs` usa somente localhost e SDKs simulados: tag Clarity, segundo estágio do runtime, imagem e collect são stubs locais interceptados; Pixel/GTM e toda rede externa/API/WhatsApp são interceptados. Seleciona a CSP do vercel.json com o parser oficial da Vercel para cada pathname e a aplica ao documento local e verifica catálogo, link direto, barra final, etapas, revisão, cópia com falha, navegação/retorno/reload, URL limpa antes do stub, ausência de dados privados nos eventos e preservação de reparo/home. Não é o SDK real nem prova de sessão gravada, máscara no servidor, recebimento Meta ou consentimento real. As regras de máscara vêm da [documentação Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking).

A execução e os logs desta contribuição ficam no relatório de integração de 23/10 em `relatorios/2026-10-23-iphone-republicacao/clarity/` no repositório de mídia. Sem commit/push/deploy nesta etapa; o pai integra o tracking e valida uma publicação única. As seções históricas acima são mantidas como registro das execuções anteriores.


## Correção CSP da barra final — 23/10/2026, R3

O QA público da R2 recebeu a CSP da compra em `/orcamento/iphone`, mas a global em `/orcamento/iphone/`, ambas 200, também com query. A R3 acrescenta somente a regra literal `/orcamento/iphone/` com a mesma CSP da compra; conserva a regra existente e todos os bytes da política global. Não altera redirecionamentos nem `trailingSlash`.

A [documentação Vercel](https://vercel.com/docs/project-configuration/vercel-json#headers) define `source` sobre o pathname, excluindo a query. O [parser oficial](https://github.com/vercel/vercel/blob/main/packages/routing-utils/src/superstatic.ts) compila headers via `sourceToRegex` com `strict: true`: na expressão gerada para `/:path*`, o segmento é opcional, mas, se a barra aparece, o conteúdo do segmento não pode ser vazio. Assim, a raiz sem barra casa; a raiz com barra e segmento vazio não. A regra literal cobre essa variante sem estender a política para páginas irmãs. Sem `trailingSlash` configurado, [as duas variantes podem servir conteúdo sem redirecionamento](https://vercel.com/docs/project-configuration/vercel-json#trailingslash).

`node scripts/test-iphone-csp-config.mjs` valida o parser, quatro URLs da compra (duas formas × com/sem query), seis caminhos fora da compra e reproduz a falha ao remover a nova regra. Os testes de navegador CSP/Clarity agora selecionam a política pela configuração interpretada pelo parser, em vez de assumir uma única source ou usar uma regex própria que aceitava indevidamente a barra final.

Ferramentas de QA podem ficar fora da aplicação, sem alterar dependências de produção:

```sh
npm install --prefix /tmp/iphone-csp-qa-tools --no-audit --no-fund @vercel/routing-utils@6.6.0
export VERCEL_ROUTING_MODULE=/tmp/iphone-csp-qa-tools/node_modules/@vercel/routing-utils/dist/index.js
node scripts/test-iphone-csp-config.mjs
```

Os scripts de navegador mantêm `PLAYWRIGHT_MODULE` e `IPHONE_QA_URL` para tooling/servidor locais. Parser, servidor local e CSP aplicada no navegador não provam o header entregue pelo edge Vercel: antes de aceitar a publicação, conferir os headers reais das quatro URLs públicas, sem substituir CSP na interceptação. SDKs, coletores, APIs e WhatsApp devem continuar interceptados; não enviar eventos reais.
