# QA — orçamento de compra de iPhone

Execução local em 21/10/2026. Commit e push autorizados pelo usuário; deploy ainda não confirmado por este relatório. Catálogo comercial `2026-10-21.v2`.

## Resultado

- `npm run lint`: passou, sem warnings.
- `npm run typecheck`: passou; também integra `npm run build`.
- `npm run build`: passou, incluindo cliente, SSR e pré-renderização de 37 páginas React; 38 URLs no sitemap contando privacidade.
- `npm test`: passaram **106 testes** dos fluxos de notebook, videogame, celular/reparo, rastreamento do reparo, computador, PC e compra de iPhone, incluindo preservação das imagens, além da auditoria SEO.
- `npm run test:iphone-purchase`: 28 testes específicos de catálogo/regras/restauração/tracking/privacidade.
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

Validações estáticas atuais: lint, typecheck, build e 106 testes de domínio/tracking/imagens, além da auditoria de 38 URLs indexáveis (links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e impressoras). O teste de mídia mede 320px, 390px, tablet, desktop e texto a 200%. Em 390×844, capacidade termina em aproximadamente 552px e a barra começa em 746px na entrada. Em alturas menores, as opções precisam de rolagem.

O WebKit local exercita a jornada sem troca; não equivale a Safari físico nem ao navegador interno real da Meta. Safe areas e teclado real continuam como aceitação em dispositivo. O teste de teclado automatizado é uma simulação de viewport, não prova de hardware. As mensagens continuam interceptadas: nenhum envio de WhatsApp ou evento real é comprovado por QA.

## Política de segurança da produção

O teste `npm run test:iphone-csp-browser` aplica o cabeçalho real de `vercel.json` ao documento local e exige que os dois modelos 3D carreguem sem violações de CSP ou erros de JavaScript. A revisão encontrou bloqueios de texturas GLB internas por `connect-src` e da inicialização WebAssembly do decoder incluído no model-viewer. O cabeçalho permite `blob:` em `connect-src` e `wasm-unsafe-eval` em `script-src`, preservando as demais diretivas. Não foi habilitado `unsafe-eval` de JavaScript.

Os testes de WebKit devem usar uma porta aceita pelo navegador, como 4178 ou 4189; 4190 é uma porta de rede restrita nesse runtime. Os logs da revisão final ficam em `.cache/iphone-final-check/`.

## Revisão final antes do commit — 21/10/2026

Lint, typecheck, build, 106 testes e auditoria SEO de 38 URLs passaram novamente. As sete suítes de navegador passaram contra uma cópia estável do build: catálogo, compra, mídia/3D do 17, 18 Pro Max, seminovos, troca e CSP de produção. A suíte de compra também passou em WebKit 375×667. Seminovos cobrem 13 ofertas e 58 cores; a triagem cobre compras do 17, 18 e seminovo com revisão, restauração, edição e resumo de WhatsApp. Nenhum teste envia mensagem ou evento externo.
