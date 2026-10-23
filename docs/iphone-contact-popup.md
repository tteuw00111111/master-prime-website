# Convite de contato de iPhone

Preparado em 23/10/2026. Configuração local pronta para ativar: `formId: '4a4Yab'` e `integrationVerified: true`. O responsável confirmou pela integração Google Sheets o envio autorizado feito pelo próprio usuário (Nome/WhatsApp presentes, pedido TRUE, origem de teste identificada). O telefone chegou com código de país 55; dados pessoais do teste não são incluídos neste repositório. A verificação da planilha foi feita pelo responsável, não pelo QA headless deste código. Esta alteração não publica o site.

## Comportamento preparado

Um `<dialog>` nativo abre ao atingir primeiro 7 segundos de página visível ou 20% da distância rolável, após uma mudança real de scroll. O componente permanece montado na troca entre catálogo e configurador. Página curta ou evento de scroll sem movimento não ativa o gatilho de rolagem. Tempo em aba oculta não é contado.

Se o visitante estiver em input, select, textarea ou conteúdo editável, o convite aguarda a saída dos campos. O botão de fechar recebe foco inicial; Escape com foco no site e botão fecham, com restauração nativa de foco. **Limitação verificada no Chrome:** quando o foco está dentro do iframe, Escape não é entregue ao dialog do site. O iframe de outra origem impede escutar suas teclas. O X do site permanece disponível; o teste reproduz a limitação, inclusive em um dialog mínimo isolado. Validar isso no formulário real antes de ativar. Se Escape também dentro do formulário for requisito obrigatório, esta preparação depende de cooperação segura do Tally ou alteração da solução de formulário. O convite aparece uma vez por sessão da aba, marcada quando é aberto, inclusive após fechar, voltar ou recarregar. Com storage bloqueado, a proteção é apenas em memória do documento; recarregar perde essa memória. Falta de suporte a dialog mantém o convite inativo.

Somente `formId` alfanumérico e `integrationVerified: true` permitem montar o convite. O iframe só existe depois da abertura. Sem os dois requisitos, há zero requests ao Tally. A CSP acrescenta apenas `https://tally.so` em `frame-src` nas duas regras iPhone, incluindo a barra final literal; CSP global e hosts Clarity da revisão R3 são preservados; não libera SDK, scripts ou connect-src do Tally no site principal.

O iframe usa `https://tally.so/embed/FORM_ID?origin=site_iphone_popup` e `referrerPolicy="no-referrer"`. A única informação de origem acrescentada pelo site é a constante `site_iphone_popup`. Não usa embed.js, não copia parâmetros da página, URL, fbclid, UTMs, estado de orçamento ou campos pessoais. O site não escuta eventos de submissão, não lê respostas, não cria eventos Meta/dataLayer e não armazena nome ou WhatsApp. As respostas e eventual confirmação de recebimento pertencem ao formulário Tally; carregar o iframe não é tratado como envio aceito nem contato salvo. O iframe é de outra origem; validar as configurações remotas de analytics/Tally e mascaramento Clarity antes da ativação.

## Referência de configuração da conta Tally (real já publicada e integração confirmada)

1. Conta e formulário reais publicados em `https://tally.so/r/4a4Yab`; acesso da conta pessoal escolhida permanece com o usuário, sem credenciais no repositório.
2. Usar estes textos, sem descontos, brindes ou promessa de venda:
   - Título do convite: **Quer ajuda para escolher seu iPhone?**
   - Descrição: **Deixe seu nome e WhatsApp para a equipe falar com você sobre modelos e condições.**
   - Campos obrigatórios: **Nome** e **WhatsApp**. Usar validação de telefone compatível com DDD e Brasil.
   - Pedido explícito obrigatório: **Quero receber contato da Master Prime pelo WhatsApp sobre esta consulta de iPhone.**
   - Botão: **Quero falar com a equipe**.
   - Campo oculto: `origin`; valor recebido do embed: `site_iphone_popup`.
   - Política: link para `https://master-prime.com/politica-de-privacidade`.
3. Tema real validado em leitura: fundo `#1a1917`, texto `#DFDFDE` e destaque `#e4d074`. Título e descrição ficam visíveis somente no formulário; o host usa identificação acessível sem duplicação visual. O conteúdo interno é configurado no Tally, não pelo CSS do site. Altura e scroll foram verificados em 320/390px e desktop.
4. Integração à planilha privada validada pelo responsável com envio do próprio usuário: Nome/WhatsApp presentes, pedido de contato TRUE, origem de teste identificada e data de envio. O telefone chegou com país 55, conforme confirmação do responsável. Não tornar a planilha pública. O QA headless não fez submissões adicionais.
5. Critério de validação já atendido pelo teste autorizado do usuário: aceite do Tally, uma linha nova no destino correto, campos completos, origem estática e acesso da equipe. Validar comportamento de erro/duplicação da integração e a confirmação exibida pelo próprio formulário. O responsável confirmou esse teste remoto feito pelo próprio usuário. Não houve novo envio pelo QA headless.
6. Revisar as configurações de dados/analytics do formulário e a política de privacidade aplicável ao pedido de contato. Não instalar Pixel, Clarity ou scripts que usem as respostas no formulário.
7. Após a confirmação remota, `formId` foi preenchido com `4a4Yab` e `integrationVerified` definido como `true`. Checks e QA foram executados antes da entrega para publicação. Esta preparação foi compatibilizada com a árvore de tracking/Clarity e CSP R3; a publicação é coordenada pelo responsável.

## QA local

`npm run lint`, `npm run typecheck`, `npm run build` e `npm test` cobrem o repositório e as auditorias existentes de links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e referências a impressoras.

`npm run test:iphone-contact-popup-browser` requer Vite local (padrão `http://127.0.0.1:4188`; usar `IPHONE_QA_URL` para outra porta). O teste substitui apenas a resposta do módulo de configuração no servidor de desenvolvimento. A configuração de produção está ativada após a confirmação do salvamento; o QA também cobre configurações desativadas. `PLAYWRIGHT_MODULE` e `PLAYWRIGHT_CHROMIUM_EXECUTABLE` podem apontar para instalações locais. Toda a rede externa, incluindo Meta, Clarity, Tally e WhatsApp, é interceptada. Os screenshots usam um formulário simulado, não o serviço real e não demonstram a integração Google Sheets.

O QA verifica os dois requisitos da configuração, os dois gatilhos, aba oculta, StrictMode, foco/teclado, digitação em quatro tipos de campo, navegação sem reiniciar o temporizador, storage indisponível, sessão após refresh e layout em 320/390px. Exercita a CSP publicada; ignora apenas a violação do websocket HMR de localhost, exclusiva do Vite dev. A jornada de consulta e a semântica de `IPhonePurchaseQuoteWhatsAppClick` permanecem as existentes: intenção de abrir WhatsApp, não mensagem, lead qualificado ou venda.

Referências primárias: [Tally — widgets](https://developers.tally.so/widgets/introduction) e [Tally — eventos](https://developers.tally.so/widgets/events). O transporte de submissão pode conter respostas completas; por isso esta implementação não registra listeners desse transporte.

## QA do formulário real, sem envio

O formulário publicado já contém título e descrição. O invólucro do site mantém esses textos como identificação acessível, sem duplicá-los visualmente, e reserva mais altura para o iframe. O cabeçalho mantém marca e X. A trava de rolagem acompanha o estado nativo `[open]` por CSS, liberando a página assim que o dialog fecha. O QA real abre o formulário em navegador headless isolado; não preenche nome/telefone, não marca checkbox e não submete. Bloqueia métodos externos diferentes de GET, eventos automáticos do Tally/Sentry e todos os transports Meta/Clarity/WhatsApp. Configurações de envio/planilha e confirmação de salvamento são verificadas separadamente pelo responsável.

O harness `test:iphone-contact-popup-real-readonly` aceita `IPHONE_QA_URL=https://master-prime.com` após publicação. Nesse destino, lê e compara a CSP da resposta real sem adicionar headers nem substituir configuração. Em localhost, aplica apenas a CSP local correspondente à rota. O script permite somente GET ao site, Tally e fontes; bloqueia os demais hosts e todos os métodos de escrita, incluindo eventos automáticos Tally/Sentry. Valida os gatilhos 7s e scroll, X, sessão após refresh, campos e foco em 320/390px e desktop, sem preencher dados ou submeter. Requer `VERCEL_ROUTING_MODULE` para o parser de rotas já usado pelo QA da revisão R3.
