# Orçamento de celular

## Escopo e intenção

A URL `/orcamento/celular` organiza uma solicitação de avaliação para **um celular por pedido**, antes de continuar a conversa pelo WhatsApp. Público: clientes finais. Marca, modelo, sintomas, detalhes e preferência de atendimento pertencem a uma única URL canônica; marcas, modelos e perguntas não geram páginas adicionais.

O fluxo usa somente serviços e sintomas já descritos no cluster `/conserto-de-celular-campo-grande-rj`: tela, bateria, carregamento, alimentação/inicialização, aquecimento, líquido, sistema e diagnóstico. “Outro problema” permite explicar o caso sem publicar um serviço novo. A seleção de um sintoma não identifica uma peça defeituosa nem confirma reparo. Valores e condições são confirmados pela equipe após avaliar o caso.

## Fluxo e regras

Cinco grupos: **Seu celular → Problemas → Detalhes → Atendimento → Revisar**. Perguntas individuais: marca → modelo → sintomas → perguntas opcionais dos sintomas selecionados → observações → atendimento → bairro/cidade, somente em retirada/entrega → revisão.

- Apple, Samsung, Motorola e Xiaomi aparecem inicialmente. “Ver todas as marcas” inclui ASUS, LG, Nokia, Realme, OPPO, Huawei, Infinix e Tecno, com busca. “Outra marca” exige nome; “Não sei a marca” permite continuar.
- Modelo aceita sugestão, texto livre ou “Não sei o modelo”. A busca começa com dois caracteres, mostra até oito resultados e filtra por marca. Marca desconhecida pesquisa todas as sugestões; marca própria permite texto livre. Selecionar uma sugestão não altera a marca informada nem avança a pergunta.
- Há oito cartões: tela, bateria, carregamento, não liga/reinicia, aquecimento, contato com líquido, sistema e outro problema. Exige ao menos um. Tela e bateria permitem múltiplas respostas nos detalhes. “Não sei dizer” é exclusivo dentro de cada pergunta e também pode ser desmarcado.
- Todas as perguntas de detalhes e as observações são opcionais. “Pular detalhes” preserva o que já foi respondido. Observações têm limite de 600 caracteres; modelo, 120; marca própria e localização, 80.
- Trocar marca limpa modelo e a opção de modelo desconhecido; mantém sintomas, detalhes e observações. Modelo desconhecido limpa o texto. Remover sintoma descarta somente seus detalhes.
- Orientações condicionais sobre líquido e tela/tampa levantando repetem o cuidado já publicado nas páginas de serviço. Não se pede para ligar ou carregar o aparelho para responder ao formulário.
- Atendimento reutiliza loja, consulta de retirada/entrega e combinar no WhatsApp. Retirada/entrega exige bairro e cidade; a cidade inicia como Rio de Janeiro. Não aprova automaticamente área, custo ou horário.
- Revisão tem “Seu celular”, “Problemas”, “Detalhes” e “Atendimento”. Editar percorre somente o grupo escolhido e retorna ao resumo, sujeito à validação dos campos obrigatórios. Voltar preserva respostas. Bairro/cidade só aparecem na revisão e na mensagem quando a preferência final é retirada/entrega.

## UI, animações e código

Reutiliza `src/components/quote/QuoteUI.tsx`, `src/styles/quote.css` e `useQuoteViewport`: Britanica, preto/dourado, ações mobile fixas, foco visível, controles de 48 px, transições direcionais de 240/130 ms, sugestões de 180 ms, disclosure de 200 ms e seleção dos cartões. A redução de movimento elimina as animações. Não há avanço automático após escolher uma opção.

Digitar ou selecionar sugestão não dispara rolagem programada. A navegação confirmada reposiciona a pergunta somente quando necessário. Ações ficam ocultas enquanto o teclado ocupa a área útil e reaparecem após a recuperação do viewport. Selecionar sugestão fecha o teclado.

As quatro marcas iniciais usam duas colunas; a regra CSS é exclusiva dos celulares. O ícone opcional de sugestões usa celular nesta rota e mantém o monitor como default para os fluxos existentes. Novos ícones de sintomas não modificam os IDs ou visuais já existentes.

Arquivos principais:

- `src/components/pages/SmartphoneQuotePage.tsx`: interface, navegação, edição e passagem ao WhatsApp.
- `src/types/smartphone-quote.ts`: contrato independente `SmartphoneQuoteDraft`.
- `src/data/smartphone-quote.ts`: marcas, sintomas, perguntas e valores iniciais.
- `src/data/smartphone-models.ts`: catálogo local de modelos, aliases e fontes dos fabricantes.
- `src/utils/smartphone-quote.ts`: identificação, busca, saneamento, respostas, rascunho e mensagem.
- `src/utils/smartphone-quote-flow.ts`: telas, grupos, escopos de edição e validação.

## Catálogo de identificação

O catálogo local contém 257 sugestões nas 12 marcas do seletor: Apple (39), Samsung (56), Motorola (16), Xiaomi (53), ASUS (7), LG (7), Nokia (20), Realme (4), OPPO (22), Huawei (22), Infinix (3) e Tecno (8). Inclui variantes como mini, Plus, Pro, Pro Max, Ultra, FE e versões 5G, conforme os nomes documentados. A cobertura é uma seleção, não uma lista completa de todos os aparelhos de cada marca.

IDs, nomes, aliases e fontes ficam em `src/data/smartphone-models.ts`, em `SMARTPHONE_CATALOG_SOURCES`. Não há API externa, importação Icecat ou credenciais. Marcas e modelos fora da lista continuam aceitos para consulta. As fontes são consultadas durante a manutenção; o formulário pesquisa somente os dados locais.

A busca preserva o significado de `+`: “S24+” e “S24 Plus” encontram a variante Plus; “Pro+” não retorna a versão Pro como se fosse o mesmo aparelho. Nomes exatos e aliases exatos têm prioridade antes do limite de oito sugestões, inclusive na busca sem marca conhecida. Busca ignora caixa, espaços e acentos.

Fontes primárias registradas no catálogo em 15/10/2026 incluem identificação da Apple, manuais e relatórios de produtos da Samsung, páginas de produtos Motorola, guias Xiaomi, modelos ROG/Zenfone da ASUS, produtos LG, guias HMD/Nokia e páginas oficiais Realme, OPPO, Huawei, Infinix e Tecno.

Essas fontes confirmam nomes de aparelhos, sem comprovar atendimento da Master Prime para cada modelo, autorização de fabricante ou peças em estoque.

## Dados e WhatsApp

Rascunho em `sessionStorage`, chave `master-prime:smartphone-quote:v1`, categoria `celular`, versão 1, com validade de duas horas. Guarda respostas, tela, grupo e escopo de edição. Rejeita categoria/versão incompatível, estrutura inválida e datas futuras/expiradas; filtra opções não definidas e limita textos. Uma posição restaurada não pode pular um campo obrigatório incompleto. Falhas de leitura, escrita ou remoção não bloqueiam o preenchimento.

Notebook e videogame mantêm suas chaves e regras próprias. Não há banco de pedidos, cadastro, uploads ou solicitação de senha, IMEI ou contas.

A mensagem personalizada usa o número comercial existente `5521967635340`; a URL só é montada no clique final. Abrir a conversa não comprova envio: o cliente precisa tocar em Enviar. Há cópia via Clipboard API e textarea selecionável quando a cópia falha.

Eventos: `quote_started`, `quote_step_completed`, `quote_reviewed`, `quote_whatsapp_click`. Payload restrito a evento, `quote_category: celular` e grupo de 1 a 5. A função compartilhada mantém notebook como categoria default. Dados do aparelho, localização, respostas, observações e URL personalizada não entram nos eventos. O formulário mantém máscara do Clarity.

## Entradas e SEO

As quatro páginas do cluster de celular têm CTA “Orçamento de celular” para a nova rota, iniciando pela marca. Mantêm o link direto “Falar pelo WhatsApp”. Nenhuma página existente foi removida ou redirecionada.

`App.tsx` registra a rota na seleção por pathname já existente. `seo.ts` define H1/title/description/canonical e a URL no conjunto indexável. A prerenderização gera a primeira pergunta, marcas e fallback de contato sem JavaScript; Vite preview serve esse documento na URL limpa. Sitemap inclui somente `https://master-prime.com/orcamento/celular`.

Breadcrumb visível e estruturado: Início → Serviços → Orçamento de celular. `WebPage.about` aponta para o `Service` de `/conserto-de-celular-campo-grande-rj`; seu provider aponta para `https://master-prime.com/#localbusiness`. Não cria outra empresa, rating ou review schema.

NAP, telefone, e-mail, horários, robots/GPTBot e redirects temporários de `/orcamento` para notebook permanecem preservados. O mapa de intenção é a solicitação guiada de orçamento de celular; as páginas existentes continuam explicando serviços e diagnóstico. Não há variações por marca, modelo ou bairro.

## Verificação

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

`scripts/test-smartphone-quote.mjs` cobre 14 cenários de identificação, busca, respostas, dependências, atendimento, mensagem, rascunho, navegação restaurada, isolamento das três categorias e privacidade. `scripts/validate-seo.mjs` verifica a nova rota, suas entradas e vínculo ao serviço, além das auditorias globais de links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e impressoras.

Verificação de navegador reproduzível:

```sh
PLAYWRIGHT_MODULE=file:///tmp/master-prime-quote-qa/node_modules/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome \
QUOTE_QA_BASE=http://127.0.0.1:4178 \
node docs/qa/smartphone-quote/verify.mjs
```

O módulo Playwright e axe-core precisam estar disponíveis no ambiente de QA; não foram adicionados como dependências de produção. O harness cobre Chromium/WebKit em 320, 390, 430 e 1440 px, motion normal/reduzido, Axe WCAG AA, teclado com viewport simulado, fluxo completo, edição, restauração, falha de storage, cópia e WhatsApp interceptado. Também seleciona e restaura um modelo de cada uma das 12 marcas, incluindo variantes Plus/Pro+, e percorre as quatro entradas reais, verifica redirects legados, HTML sem JavaScript e faz smoke tests de notebook e controle. Evidências e `results.json` ficam em `docs/qa/smartphone-quote/`.

Resultado em 15/10/2026: lint, typecheck, build e suíte completa aprovados, incluindo os 14 testes de celular e a auditoria SEO global. Os dez cenários de navegador passaram: oito combinações de engine/viewport e duas baterias adicionais de variantes, regressão e entradas. Axe não encontrou violações nos estados auditados; não houve erro de hidratação ou overflow horizontal nos fluxos principais. As capturas de entrada, sintomas e revisão foram inspecionadas visualmente. Nenhuma mensagem foi enviada à empresa.

Teclado nativo de iOS/Android precisa de conferência em aparelho físico. Não houve publicação em produção nem acesso a Search Console, Analytics, GBP, CrUX ou dados de backlinks. Uma URL pública inexistente retornou 404 antes da alteração; o preview local foi iniciado para os testes. Não foram feitas remoções ou mudanças de redirect que exigissem investigar tráfego histórico.
