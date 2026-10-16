# Orçamento de computador e PC gamer

## Escopo e intenção

Página pública `/orcamento/computador` para problemas de computadores desktop e PC gamer existentes, consultas de limpeza/manutenção, SSD, memória RAM, outros upgrades e formatação/sistema. Os serviços seguem o conteúdo comercial já publicado no cluster de computador e no de PC gamer. Notebook permanece em seu próprio fluxo.

Não há preço automático, prazo, promessa de diagnóstico, garantia nova, seleção de peças ou aprovação de compatibilidade. Informar que há arquivos a preservar não garante recuperação nem preservação; é um relato para a avaliação da equipe. O resumo usa linguagem de consulta e não autoriza uma intervenção.

O contrato `ComputerQuoteIntent` deste fluxo continua aceitando somente `repair`. A intenção `build` não é exposta nem aceita nesta página; os testes comprovam sua rejeição. O planejamento e a montagem agora têm implementação independente em [`/orcamento/pc-gamer`](orcamento-pc-gamer.md), com perguntas, validação, mensagens e restauração próprios, sem migrar os rascunhos de reparo.

## Fluxo e interface

Cinco grupos de progresso: **Seu computador → O problema → Os detalhes → Atendimento → Revisar**. Uma pergunta por tela, sempre na mesma URL.

1. Tipo: Computador, PC gamer ou Não sei dizer. Depois, um campo opcional de marca/modelo/configuração, com até 300 caracteres. Não há catálogo nem campos separados para componentes.
2. Seleção múltipla de sintomas ou solicitações. Qualquer solicitação pode ser a única seleção, sem exigir um defeito.
3. Perguntas opcionais conforme as seleções, uma por vez; upgrades compartilham a mesma pergunta de objetivos. Observações aceitam até 600 caracteres. “Pular detalhes” preserva dados existentes.
4. Atendimento em loja, consulta de retirada/entrega ou combinação pelo WhatsApp. Bairro e cidade são obrigatórios apenas para retirada/entrega. Rio de Janeiro é o valor inicial da cidade; disponibilidade e condições dependem de confirmação.
5. Revisão editável de computador, problemas/solicitações, detalhes e atendimento. A edição percorre somente o grupo escolhido e volta ao resumo. Se faltar um campo obrigatório, a navegação leva a esse campo.

Reutiliza os componentes de `QuoteUI.tsx`, os estilos existentes e `useQuoteViewport`. Mantém Britanica, fundo escuro, dourado nas seleções e verde no CTA final. O videogame é a referência de movimento: transição direcional com entrada de 0,24 s e saída de 0,13 s, opções com entrada escalonada, resposta ao toque e disclosures compartilhados. A preferência de redução de movimento é respeitada. Não houve mudança de estilo nos fluxos existentes.

Os erros focam o controle correspondente. A navegação foca o título sem abrir o teclado; a rolagem para o topo do grupo ocorre somente quando o título não está visível, como no videogame. O hook compartilhado controla a apresentação das ações durante o teclado mobile. Repetições de clique durante uma transição são bloqueadas também por uma referência síncrona.

## Dados, privacidade e WhatsApp

`ComputerQuoteDraft` tem versão 1, categoria `computador`, intent `repair`, tipo de computador, configuração livre, IDs de seleções, respostas condicionais, observações e preferência de atendimento/localização.

Rascunho na mesma aba com a chave exclusiva `master-prime:computer-quote:v1`, validade de duas horas, pergunta atual e escopo de edição. Rascunhos vencidos, futuros, malformados ou de outra categoria/intent são rejeitados. Limites de texto e opções válidas são reaplicados ao restaurar. Falhas de storage não impedem preenchimento nem WhatsApp.

Seleções e respostas são saneadas após edições e restauração. Perguntas de seleções removidas deixam de existir; respostas obsoletas são excluídas. A pergunta compartilhada de upgrade e suas respostas permanecem enquanto houver algum upgrade selecionado.

O resumo contém apenas os sintomas/solicitações e respostas ativos. Configuração vazia não gera linha vazia de modelo. Bairro e cidade só entram na mensagem quando a opção final é retirada/entrega, mesmo se houver localização de uma escolha anterior no rascunho.

A URL personalizada do WhatsApp é criada somente no clique e usa o telefone existente. Abrir a conversa não significa enviar o pedido. É possível abrir novamente, copiar o resumo pela Clipboard API ou selecionar o texto manualmente quando a cópia falhar. Não são enviados pedidos automaticamente, nem armazenados no servidor.

Eventos `quote_started`, `quote_step_completed`, `quote_reviewed` e `quote_whatsapp_click` usam somente evento, categoria `computador` e número do grupo. Não recebem configuração, observações, bairro/cidade ou URL personalizada. O conteúdo do formulário mantém a máscara do Clarity.

## Rotas, descoberta e SEO

- Rota independente registrada em `App.tsx`, sem nova biblioteca de router.
- CTAs nas quatro páginas do cluster de computador e nas duas páginas de PC gamer. Links de PC gamer usam `?tipo=pc-gamer`; o cliente pode alterar a seleção. Um rascunho válido tem prioridade sobre esse parâmetro.
- Links e URLs das páginas de serviço foram preservados, assim como o contato direto pelo WhatsApp.
- Title, description e H1 próprios. Canonical: `https://master-prime.com/orcamento/computador`, sem parâmetro.
- Breadcrumb visível e estruturado: Início → Serviços → Orçamento de computador.
- JSON-LD com WebPage relacionada aos serviços existentes de computador e manutenção de PC gamer; ambos apontam para `https://master-prime.com/#localbusiness`.
- HTML inicial e alternativa de contato sem JavaScript pré-renderizados. Rota incluída em `PUBLIC_INDEXABLE_PATHS`, no sitemap gerado e no conjunto de documentos limpos do preview.
- NAP, telefone, e-mail, horários, robots, política de GPTBot e redirects anteriores preservados. Sem impressoras ou rating/review schema.

Os arquivos compartilhados receberam alterações aditivas, preservando a implementação de celular que estava sendo desenvolvida na mesma pasta. A fonte de verdade comercial foi o repositório atual; não houve pesquisa de mercado nem mudança na arquitetura das páginas de serviço. Dados externos de Search Console, backlinks e conversão não foram consultados.

## Verificação reproduzível

```sh
npm run lint
npm run typecheck
npm run build
npm test
npm run test:computer
```

Regras específicas em `scripts/test-computer-quote.mjs`: identificação opcional, sintomas e solicitações, deduplicação, saneamento de respostas, atendimento, escopos de edição, rascunhos, limites de texto, rejeição de montagem futura, mensagem/acentos e privacidade de tracking.

Teste de navegador em `docs/qa/computer-quote/verify.mjs`. Aceita `PLAYWRIGHT_MODULE` como URL `file://` para uma instalação externa de Playwright, `CHROMIUM_EXECUTABLE` opcional e `QUOTE_QA_BASE` para escolher o preview. Axe é resolvido junto à instalação de Playwright. Não adiciona dependências ao projeto.

```sh
npm run preview -- --host 127.0.0.1 --port 4186 --strictPort
PLAYWRIGHT_MODULE=file:///tmp/master-prime-quote-qa/node_modules/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/home/wayne/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome \
node docs/qa/computer-quote/verify.mjs
```

Capturas, amostras de movimento e resultados ficam na mesma pasta do script. Os testes interceptam chamadas externas e abertura do WhatsApp; nenhuma mensagem é enviada.

## Limites de ambiente

Antes do commit, as alterações de computador foram isoladas das alterações de celular ainda presentes no workspace. Essa versão isolada passou novamente em lint, typecheck, build, 39 testes (notebook, videogame e computador) e auditoria SEO de 35 páginas indexáveis.

Revalidação em 15/10/2026: lint, typecheck, build com pré-renderização, os 53 testes dos quatro fluxos e a auditoria SEO passaram. A auditoria cobriu 36 páginas indexáveis, incluindo links, metadata, H1, canonical, sitemap, robots, redirects, JSON-LD, NAP e referências a impressoras. Chromium e WebKit passaram nas larguras de 320, 390, 430 e 1440 px, além de três repetições dos casos adicionais por navegador; WhatsApp foi interceptado. O registro da execução de navegador está em [`qa/computer-quote/results.json`](qa/computer-quote/results.json), com os casos adicionais em [`qa/computer-quote/edgecases.json`](qa/computer-quote/edgecases.json).

O preview do Vite já tinha fallback SPA que retorna HTTP 200 para URLs desconhecidas, embora a aplicação mostre “Página não encontrada” após hidratar. Esta alteração preserva esse comportamento. A configuração de produção continua sem catch-all; a auditoria verifica essa configuração e os destinos gerados, mas não substitui uma verificação HTTP após publicação.

Emulação de viewport não reproduz o teclado físico de Android/iOS. Axe e verificações automatizadas complementam a revisão visual, sem substituir testes em aparelhos reais. Não houve publicação em produção nem teste de conversão.
