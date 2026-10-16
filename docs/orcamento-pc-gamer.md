# Orçamento para montar um PC

## Objetivo e escopo

Rota pública `/orcamento/pc-gamer`, em português, para solicitar planejamento e montagem de um PC para jogos, trabalho/estudo ou ambos. Aceita PC completo, uso de algumas peças do cliente e montagem com todas as peças fornecidas pelo cliente. O escopo foi confirmado pela empresa nesta solicitação.

O resultado é um briefing revisável para atendimento pelo WhatsApp. Não é compra, reserva de peças, orçamento automático, aprovação de compatibilidade ou promessa de FPS. Não recebe uploads nem dados de contato adicionais, não envia mensagens automaticamente e não armazena pedidos no servidor.

O fluxo existente de reparos em `/orcamento/computador` continua separado, com seu contrato `repair`, armazenamento e URLs anteriores.

## Fluxo

Cinco grupos: **Seu projeto → Investimento → Uso e preferências → Atendimento → Revisar**. Uma pergunta principal por tela, avanço explícito, retorno e edição por grupo. As perguntas são geradas por `getPcBuildScreens` conforme as escolhas.

1. Tipo de montagem, finalidade e identificação opcional das peças existentes.
2. Investimento em reais ou “Ainda não defini”; escopo do valor e seleção opcional de monitor, teclado, mouse e headset. Peças já possuídas não entram no valor. Entrega é combinada separadamente.
3. Jogos e/ou programas conforme a finalidade, objetivo opcional e escolha de personalização. Há nove jogos iniciais e oito programas, busca por nome/aliases e inclusão livre de nomes ausentes. Limite conjunto de dez opções por lista, deduplicação de nomes/aliases sem distinção de caixa ou acento e nomes livres de até 60 caracteres. “Ainda não sei” é exclusivo das escolhas. O título genérico “Call of Duty” não é convertido automaticamente em Warzone.
4. Se o cliente personalizar: resolução, meta de FPS, experiência gráfica, tarefas de trabalho, até duas prioridades, preferência de GPU/CPU, cor/RGB, conectividade, intenção de compra e observações. Todos são opcionais. Pular os próximos detalhes conserva respostas válidas já preenchidas. Metas personalizadas incompletas não geram um bloqueio oculto ao voltar para o essencial.
5. Retirar na loja, consultar entrega ou combinar no WhatsApp. Bairro/cidade são obrigatórios somente para entrega; cidade inicial: Rio de Janeiro. A revisão permite editar cada grupo e volta ao resumo, encaminhando primeiro a qualquer campo obrigatório que ficou incompleto.

Valores são armazenados em centavos inteiros seguros. São aceitos formatos brasileiros como `1000`, `1.000` e `R$ 1.000,50`; negativos, notação exponencial, números inseguros e formatos inválidos são rejeitados. Não existe valor mínimo comercial. Textos: peças/observações 600 caracteres; objetivo/tarefas 300; bairro/cidade 80.

## Direção visual

A consulta mantém Britanica, fundo escuro, dourado nas seleções e verde no WhatsApp. A imagem decorativa de PC já existente aparece ao lado da pergunta inicial, sem seção de entrada adicional. Não é apresentada como equipamento vendido ou montagem realizada pela empresa.

O resumo “Seu projeto” é compacto e começa fechado. As seleções do catálogo também podem ser expandidas em “Ver escolhas”, evitando empurrar as capas para baixo. Programas usam os ícones disponíveis no projeto e alternativas neutras com o nome sempre visível. O gabinete é uma ilustração SVG interativa: materiais, ventoinhas e iluminação respondem às preferências sem representar um produto específico.

`PC_EXPERIENCE_IMAGE` reserva um espaço para fotografia real aprovada da empresa. Enquanto não houver arquivo, descrição alternativa e dimensões, nada é exibido nesse espaço. Não foi produzida prova de experiência fictícia.

São reutilizados `QuoteLayout`, `QuoteProgress`, `QuoteStepTransition`, `QuoteReviewSection`, `QuoteHandoff`, `QuoteReveal` e `useQuoteViewport`. A transição tem entrada de 240 ms, saída de 130 ms e direção correspondente ao avanço/retorno. Controles respondem ao toque, chips entram/saem e disclosures expandem com transição curta. Navegação repetida é bloqueada por referência síncrona. A redução de movimento desativa animações e mantém todo o conteúdo disponível.

Na restauração, a árvore de transições é reiniciada uma única vez para apresentar a pergunta salva sem manter interativa a pergunta inicial durante uma saída animada. Erros focam o campo e a navegação foca o título, sem abrir teclado. A página respeita o comportamento de teclado mobile do hook compartilhado.

Em telas mobile curtas, a pergunta entra abaixo da barra de progresso fixa, permitindo visualizar a primeira linha de jogos acima das ações. A ilustração do gabinete reduz de tamanho no mobile para aproximar as opções de cor; a barra de progresso tem fundo opaco em telas de até 700 px de altura.

## Orientação de hardware e viabilidade

As explicações de GPU/CPU são conteúdo editorial revisado, com links primários e data de revisão. Evitam regras de marca como “Ryzen sempre é melhor em multitarefa” ou “FSR sempre é inferior”. A comparação orienta a analisar modelos, geração, suporte de jogos/programas, memória, consumo e custo da plataforma.

Metas de pelo menos 240 FPS com jogos informados mostram um aviso contextual com o investimento, quando definido, e ações para rever valor/desempenho ou pedir orientação. Isso sinaliza a necessidade de avaliação; não classifica automaticamente um orçamento como impossível. O pedido de orientação e o contexto seguem no resumo do WhatsApp.

`PC_BUDGET_REFERENCES` começa vazio. Nenhum preço mínimo nem benchmark comercial foi inventado. O motor aceita referências revisadas com ID, jogo, resolução, perfil gráfico, meta, orçamento mínimo em centavos, fonte HTTPS, data de revisão e validade. Só uma correspondência exata, vigente e abaixo do valor de referência gera aviso de orçamento. Essa comparação só se aplica a PC completo; o orçamento de montagem ou de peças faltantes não é comparado ao custo de um PC inteiro. Na ausência de referência, não aparece uma aprovação ou previsão de FPS.

Adicionar referências exige preços datados e benchmarks equivalentes revisados pela empresa. Os requisitos mínimos de jogos e os catálogos de produtos não são uma fonte de previsão de FPS. Referências fictícias presentes nos testes são isoladas dos dados publicados.

## Catálogo e imagens de jogos

`src/data/pc-game-artwork.json` registra origem, provedor e arquivos locais de nove capas importadas do IGDB. Atribuição fica visível na pergunta de jogos. Falha de imagem mostra um ícone e mantém texto/seleção disponíveis. O cliente não consulta APIs externas.

```sh
cp .env.igdb.example .env.igdb.local
# Preencher IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no arquivo local.
npm run catalog:games
```

O importador usa credenciais locais ou de ambiente, obtém um token de aplicação no Twitch, procura correspondências exatas de títulos/aliases para PC e baixa capas somente de hosts aprovados. Não registra segredos, tokens ou corpos de erro. As imagens são otimizadas em WebP; o manifest só é substituído depois que todos os downloads terminam. Falha mantém o manifest anterior. Sem credenciais, o importador consulta o FreeToGame e cobre apenas os jogos correspondentes desse catálogo.

As credenciais existentes foram verificadas e guardadas em `.env.igdb.local`, ignorado pelo Git, sem prefixo `VITE_`. A configuração do Open Icecat permanece separada e inalterada. Este fluxo usa identificação livre de peças, sem transformar o catálogo Icecat em um configurador de compatibilidade.

Fontes e condições: [IGDB — configuração e parceria comercial](https://api-docs.igdb.com/), [FreeToGame — API](https://www.freetogame.com/api-doc). O IGDB permite cache e descreve acesso comercial gratuito mediante parceria; autenticação técnica não confirma essa parceria. A publicação em produção precisa respeitar o acordo do titular da conta e as condições dos provedores. Não houve publicação nesta tarefa.

## Dados, privacidade e WhatsApp

`PcBuildQuoteDraft`: versão 1, categoria `montagem-pc`, intent `build`. Rascunho exclusivo na mesma aba em `master-prime:pc-build-quote:v1`, validade de duas horas, pergunta e escopo de edição. Dados vencidos, futuros, malformados, com tipos incorretos ou de outra versão/categoria/intent são rejeitados. Opções e limites são reaplicados na restauração. Falhas de storage não bloqueiam o formulário.

Mudanças de finalidade removem jogos/programas e respostas condicionais inativos. PC completo remove a identificação de peças existentes. Localização antiga nunca entra no resumo quando a escolha final é loja ou combinar pelo WhatsApp. Dados válidos opcionais são mantidos ao pular personalização.

Formulário e resumo compacto têm máscara do Clarity. Tracking usa apenas `event`, `quote_category: montagem-pc` e `quote_step`, nos eventos já existentes. Investimento, escolhas, textos, endereço e URL personalizada não entram nos eventos. A URL compartilhável não contém respostas.

A URL personalizada do WhatsApp é criada no clique usando o telefone existente. Abrir a conversa não confirma envio nem recebimento. É possível abrir novamente, copiar o resumo ou usar texto selecionável se a Clipboard API falhar. Nenhuma mensagem foi enviada nos testes.

## Rotas e SEO

Rota registrada em `App.tsx`, metadata própria, canonical limpo, breadcrumb Início → Serviços → Montar seu PC e links naturais no hub e nas duas páginas de PC gamer. HTML inicial e alternativa sem JavaScript são pré-renderizados. A rota entra no sitemap e no conjunto de documentos limpos do preview.

JSON-LD: `WebPage`, `Service` de planejamento/montagem com `provider` apontando para `https://master-prime.com/#localbusiness`, e `BreadcrumbList`. NAP, contatos, horários, serviços anteriores, robots e política de GPTBot foram preservados. Sem schema de review/rating ou serviços de impressoras.

## Verificação

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Os 15 testes novos cobrem modos/finalidades, moeda, escopo, catálogos, inclusão livre, deduplicação/limites, exclusividade de incerteza, saneamento condicional, opcionais, escopos de edição, restauração, entrega, mensagens, avisos com referências datadas e privacidade. A suíte existente e a auditoria SEO continuam obrigatórias.

Verificação de navegador reproduzível, usando a instalação externa de Playwright já disponível:

```sh
npm run preview -- --host 127.0.0.1 --port 4192 --strictPort
PLAYWRIGHT_MODULE=file:///tmp/master-prime-quote-qa/node_modules/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/home/wayne/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome \
node docs/qa/pc-build-quote/verify.mjs
```

O script cobre Chromium/WebKit em 320, 390, 430 e 1440 px, fluxo misto completo, seleção livre, foco/erros, aviso de FPS, orientação GPU, visual, entrega, restauração por refresh, cópia com falha, mensagem/privacidade, edição com remoção de dados inativos, movimento e ausência de overflow. Casos adicionais de montagem, storage negado, incerteza, cliques repetidos, teclado por viewport simulado, imagens ausentes e rascunho vencido repetem três vezes por engine. Também verifica o HTML sem JavaScript.

Relatório, capturas e vídeos ficam em `docs/qa/pc-build-quote/`. Capturas com tamanho de viewport não equivalem a teste em aparelho físico. O teclado foi simulado pela API de viewport; Android/iOS reais ainda exigem validação em dispositivo. Não foi executado teste de conversão nem foi verificada entrega HTTP em produção.

### Resultados em 16/10/2026

- Lint, typecheck e build com pré-renderização: aprovados.
- 68 testes automatizados, incluindo 15 do planejador: aprovados.
- Auditoria SEO das 37 URLs indexáveis: aprovada, incluindo links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e exclusão de impressoras nos serviços/dados estruturados.
- Matriz completa de Chromium/WebKit nas quatro larguras, mais três repetições dos casos adicionais por engine: 14 cenários aprovados, além da alternativa sem JavaScript em ambos.
- Após os últimos ajustes exclusivamente de CSS, 16 cenários focados de layout e acessibilidade foram aprovados. A primeira linha de jogos e a primeira opção de cor ficaram fora da área das ações fixas em 320, 390 e 430 px; nenhuma violação dos conjuntos WCAG 2 A/AA e 2.1 AA executados pelo Axe nessas regiões.
- Duas rodadas independentes de revisão visual: 7/10 e 8/10. As duas observações finais de baixa gravidade foram corrigidas e verificadas pelo agente principal. Não foi atribuída nova nota após essas correções.
- Credenciais ausentes de código público, documentação e artefatos de build; arquivo local ignorado pelo Git e com permissões `0600`.

Evidência: [`qa/pc-build-quote/results.json`](qa/pc-build-quote/results.json), [`qa/pc-build-quote/layout-results.json`](qa/pc-build-quote/layout-results.json), [`qa/pc-build-quote/visual-review.md`](qa/pc-build-quote/visual-review.md), 34 capturas e dois vídeos. Para repetir a verificação focada após mudanças de CSS, use o mesmo ambiente acima com `node docs/qa/pc-build-quote/verify-layout.mjs`.
