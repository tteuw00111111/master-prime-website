# Orçamento de videogame e controle

## Escopo e intenção

A rota `/orcamento/videogame` organiza uma solicitação de orçamento para um videogame, um controle ou ambos antes de continuar pelo WhatsApp. Público: clientes finais. Intenção principal: informar modelo, sintomas e preferência de atendimento. Uma única URL canônica atende o fluxo; perguntas, plataformas e combinações de aparelhos não criam páginas indexáveis adicionais.

As sugestões cobrem PS4/original, Slim e Pro; PS5/original, Slim e Pro; Xbox One/original, S e X; Series X e S. Controles incluem DualShock 4, DualSense, DualSense Edge e variantes Xbox One, Series e Elite. A lista ajuda na identificação, sem prometer disponibilidade de conserto, peças ou autorização de fabricante. O campo de modelo é uma busca da lista permitida: somente nomes ou aliases exatos desses modelos são aceitos. Texto livre não pode identificar outro aparelho. A opção “Não sei o modelo” não aparece no fluxo gaming; quem precisa identificar o aparelho pode pedir ajuda no WhatsApp. Não são solicitados número de série, senha, conta, cadastro ou upload. A exclusão das gerações anteriores e a recusa explícita para PS3/Xbox 360 foram confirmadas pelo usuário durante a implementação.

Os serviços existentes no repositório confirmam diagnóstico/manutenção de videogames, limpeza quando indicada, manutenção de controles, correção de drift e consulta de Hall Effect conforme compatibilidade. A escolha de um sintoma não determina peça ou diagnóstico. Não há preços, prazos, garantias ou aprovação automática de retirada/entrega.

## Fluxo

Cinco grupos visíveis: Aparelhos → Problemas → Detalhes → Atendimento → Revisar. A primeira pergunta oferece Videogame, Controle e Videogame e controle. No pedido combinado, a identificação do console vem antes da do controle; sintomas e perguntas opcionais são separados por aparelho. Plataforma/modelo aparecem no contexto das perguntas seguintes.

Cada pedido admite até um videogame e um controle, inclusive de plataformas diferentes. Cada aparelho ativo exige plataforma ou “Não sei”, um modelo permitido e ao menos um sintoma/solicitação. “Não sei” na plataforma permite pesquisar os modelos das duas plataformas, mas não dispensa a escolha de um modelo permitido. Perguntas condicionais e observações são opcionais. “Pular detalhes” mantém o que já foi respondido.

Há uma preferência de atendimento por pedido: levar à loja, consultar retirada/entrega ou combinar pelo WhatsApp. Retirada/entrega exige bairro e cidade, sem aprovação automática de região, custo ou horário. O endereço completo fica para a conversa.

A revisão tem seleção de aparelhos, identificação e sintomas de cada aparelho, detalhes compartilhados e atendimento. Editar identificação ou problemas retorna ao resumo após o trecho escolhido. Adicionar um aparelho pela revisão obriga a completar sua identificação e sintomas antes de retornar. Voltar preserva respostas.

Trocar a plataforma limpa o modelo e as respostas condicionais daquele aparelho. Remover um sintoma descarta seus detalhes. Trocar para um modelo inequivocamente sem leitor remove o sintoma de disco e sua resposta. Não se presume ausência de leitor a partir de “PS5”, “PS5 Slim”, “PS5 Pro” ou “Series X”. Desativar um aparelho mantém seu rascunho para eventual reativação, mas o exclui da validação, revisão e mensagem.

## Componentes e animações

`src/components/quote/QuoteUI.tsx` é compartilhado com `/orcamento/notebook`: layout, progresso, transição por pergunta, sugestões, disclosure, cartões de sintomas, atendimento, seções de revisão e passagem ao WhatsApp. Dados/regras de notebook permanecem separados, incluindo catálogo Icecat, chave de storage e compatibilidade dos rascunhos anteriores.

A interface conserva Britanica, preto/dourado, ações mobile fixas, foco visível e botões de 48 px. Reutiliza transições direcionais (entrada de 240 ms, saída de 130 ms), sugestões (180 ms), disclosure (200 ms), seleção e entrada dos cartões. `prefers-reduced-motion` elimina deslocamentos e animações. Não há avanço automático pela seleção de uma opção.

Apenas navegação confirmada pode reposicionar a pergunta quando estiver fora da área de leitura. Digitação e escolha de modelo não programam rolagem. Selecionar uma sugestão fecha o teclado. O hook compartilhado `useQuoteViewport` oculta as ações enquanto o teclado ocupa a área útil, sem mover o rodapé por cima dele.

## Dados e privacidade

Tipos em `src/types/gaming-quote.ts`; dados/catálogo em `src/data/gaming-quote.ts`; validação, saneamento e mensagem em `src/utils/gaming-quote.ts`; telas em `src/utils/gaming-quote-flow.ts`.

O rascunho usa `master-prime:gaming-quote:v1` no `sessionStorage`, com validade de duas horas. Armazena modo, registros independentes por aparelho, observações, atendimento, localização, tela e contexto de edição. A restauração rejeita versão/categoria incorretas, data futura/expirada e estrutura inválida; filtra opções não definidas e não salta campos obrigatórios. Falha de storage não bloqueia o formulário.

A mensagem tem seções Videogame e Controle somente para aparelhos ativos. Bairro e cidade só entram quando a opção final é retirada/entrega. A URL personalizada é construída apenas no clique final. O número permanece o comercial existente: 5521967635340. Abrir a conversa não comprova envio; o cliente precisa tocar em Enviar. Há cópia por Clipboard API e texto selecionável quando ela falha.

Eventos mantidos: `quote_started`, `quote_step_completed`, `quote_reviewed`, `quote_whatsapp_click`. Payload restrito a evento, `quote_category: videogame` e número do grupo. O argumento de categoria continua opcional com default `notebook` na função compartilhada. Modelo, plataforma, texto livre, localização, URL e mensagem não são enviados nos eventos de orçamento. O formulário mantém a máscara do Clarity.

## Entradas e SEO

Páginas dos clusters de videogame e controle recebem CTA para o formulário e preservam acesso direto pelo WhatsApp:

- Console: `/orcamento/videogame?aparelho=videogame`.
- Controle: `/orcamento/videogame?aparelho=controle`.

Digitar PS3, PlayStation 3, DualShock 3, Xbox 360 ou outros modelos de gerações antigas mostra imediatamente uma recusa explícita, por exemplo: “Não atendemos PS3 nem controles dessa geração.” A mensagem informa as gerações aceitas e o botão Continuar valida o modelo. O mesmo bloqueio vale para consoles e controles, inclusive rascunhos antigos: uma escolha desconhecida anterior é limpa e solicita identificação antes da revisão.

O parâmetro pré-seleciona a escolha inicial após hidratação, somente na ausência de rascunho válido. Não avança a pergunta e pode ser alterado. Rascunho válido tem prioridade. Todos os parâmetros usam a mesma canonical; a auditoria de links remove query/hash para validar destinos internos.

A rota tem um H1 próprio, title, description, canonical, breadcrumb Início → Serviços → Orçamento de videogame e controle e HTML inicial pré-renderizado. O JSON-LD relaciona WebPage aos dois Services existentes, com provider apontando para `https://master-prime.com/#localbusiness`. Não cria outra entidade comercial nem rating/review schema. O HTML sem JavaScript exibe a escolha inicial e contato alternativo.

O sitemap inclui apenas a URL base. A configuração de preview serve os documentos pré-renderizados nas URLs limpas de orçamento e serviços, evitando hidratar o HTML da home ao testar uma entrada de serviço. `/orcamento`, `/orcamento/` e `/orcamento/index.html` continuam com redirect temporário 302 para notebook, preservando parâmetros. O seletor geral de categorias permanece para outra fase. NAP, telefone, e-mail, horários, robots/GPTBot e URLs de serviço existentes são preservados.

## Fontes de identificação

Catálogo pequeno, local, sem importação Icecat para videogames e sem API externa durante o preenchimento. A fonte fica registrada em cada sugestão:

- [Manuais de consoles e controles PlayStation](https://www.playstation.com/pt-br/support/hardware/manuals/).
- [Controles Xbox](https://www.xbox.com/en-US/accessories/controllers).
- [Comparação dos consoles Xbox](https://www.xbox.com/pt-BR/consoles/compare).
- [Xbox One S All-Digital](https://news.microsoft.com/pt-br/apresentamos-o-mais-novo-membro-da-familia-xbox-one-o-xbox-one-s-all-digital-edition/).

Essas fontes identificam produtos; não são evidência de que a Master Prime conserta todo modelo sugerido.

## Validação

Comandos principais:

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

`npm test` inclui os 15 testes existentes de notebook/catálogo, 13 testes novos de regras do fluxo gaming e auditoria SEO das 34 URLs indexáveis. A auditoria cobre links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP, preservação de redirects, contato direto e exclusão de impressoras como serviço atual.

A verificação de navegador fica em `docs/qa/gaming-quote/verify.mjs`; `verify-entry-links.mjs` verifica o clique real nos CTAs de serviço, preseleção, canonical sem parâmetros e o redirect legado. Ela usa Playwright e axe-core disponíveis no ambiente, sem acrescentar dependências de produção. Exemplo com os módulos locais desta sessão e um preview em 4189:

```sh
PLAYWRIGHT_MODULE=file:///tmp/master-prime-quote-qa/node_modules/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome \
QUOTE_QA_BASE=http://127.0.0.1:4189 \
node docs/qa/gaming-quote/verify.mjs
```

As evidências e resultados ficam no mesmo diretório. Navegação externa é interceptada; nenhum pedido é enviado à empresa. Testes de teclado usam geometria simulada; a animação do teclado nativo de iOS/Android exige conferência em aparelho físico.

Na menor tela testada, 320×568, as três opções iniciais ficam acima das ações fixas: a instrução redundante foi removida e as opções usam espaçamento compacto apenas em telas pequenas e baixas.

Não houve publicação em produção nem consulta a Search Console, Analytics, GBP, CrUX ou dados externos de backlinks. Nenhuma URL existente foi removida ou redirecionada por esta implementação. Antes da edição, a rota local de notebook respondeu 200 e uma URL desconhecida no domínio público respondeu 404.

## Resultado desta entrega

Lint, typecheck e build aprovados. Os 28 testes de regras/integridade (15 de notebook e 13 de gaming) e a auditoria SEO das 34 URLs indexáveis foram aprovados. O build gerou 33 documentos React e preservou a política de privacidade estática.

As verificações de navegador cobrem Chromium e WebKit em 320, 390, 430 e 1440 px, incluindo redução de movimento, recusa imediata de PS3/Xbox 360, bloqueio de avanço, três escolhas iniciais acima das ações fixas, fluxo combinado, remoção/reativação de aparelho, revisão, rascunho e edição após recarregar, retirada/loja, cópia e falha de Clipboard API, privacidade dos eventos, resumo WhatsApp, regressão de notebook e Axe WCAG AA. As amostras de frames verificam entrada/saída gradual e ausência de deslocamento com redução de movimento. Nenhuma mensagem foi enviada ao WhatsApp.

Os cliques reais nas páginas de serviço também foram verificados, incluindo categoria inicial editável, canonical sem parâmetros, contato direto e redirect temporário com parâmetros preservados. Os relatórios são `docs/qa/gaming-quote/results.json` e `entry-links.json`; capturas e frames ficam ao lado deles.
