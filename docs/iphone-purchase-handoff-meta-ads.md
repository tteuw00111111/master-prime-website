# Handoff — compra de iPhone no site

Atualizado em 21/10/2026 para a jornada `2026-10-21.reduced-v1`, conforme `PROMPT-SIMPLIFICAR-SITE-PARA-TESTE.md`. Commit, push e deploy autorizados; o estado final da publicação será informado na entrega. Nenhum recebimento de evento foi confirmado no Gerenciador de Eventos.

## Jornada reduzida

1. **Seu iPhone:** produto, capacidade, condição e cor; seminovos mantêm preferências múltiplas de cor.
2. **Pagamento:** À vista (Pix ou Cartão) ou Cartão de crédito (2–12 parcelas).
3. **Revisar:** somente aparelho e pagamento, com edição, cópia e abertura do WhatsApp +55 21 96763-5340.

Prazo de compra, oferta de usado e perguntas de modelo/bateria/estado/reparos/funcionamento do usado foram retirados. Não se presume compra imediata nem compra sem troca. Esses assuntos ficam para a equipe no WhatsApp. A possibilidade de troca permanece sujeita à avaliação; não há crédito estimado nem ampliação da política: para compra do 17 Pro Max, a referência confirmada continua sendo linha iPhone 15 em diante; para outros produtos, a política depende de confirmação da equipe. O site não implementa cobrança, checkout, reserva ou confirmação de compra.

### Mensagem exata de exemplo

Exemplo: 17 Pro Max, 256 GB, lacrado laranja, preferência À vista/Pix. As linhas de aparelho, cores e pagamento variam apenas conforme as escolhas e a tabela atual. A primeira frase é fixa e identifica a consulta no site; o cliente pode alterá-la, portanto não garante associação com a conversa recebida.

```text
Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.

APARELHO DESEJADO
iPhone 17 Pro Max · 256 GB · Lacrado · Laranja
À vista: R$ 7.699,99
Cartão: 12× de R$ 696,66 (última de R$ 696,62) · Total: R$ 8.359,88
Pagamento pretendido: À vista · Pix
Valores consultados na tabela de 21/10/2026. Gostaria de confirmar valores e disponibilidade.
```

No crédito, o resumo informa a quantidade escolhida, total e eventual ajuste da última parcela. Para seminovos, inclui as cores aceitas e aviso de confirmação da condição/disponibilidade. Não inclui prazo, usado oferecido, Ref., códigos, IDs de anúncio, UTMs, fbclid ou identificador de tentativa.

## URLs preparadas

- Canônica: `https://master-prime.com/orcamento/iphone`.
- Link inicial: `https://master-prime.com/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed`.
- Alternativa: `https://master-prime.com/orcamento/iphone?model=iphone-17-pro-max&capacity=512&condition=sealed`.
- As URLs existentes são preservadas. Localmente usar o mesmo caminho no servidor de desenvolvimento/preview.
- O modelo e a capacidade chegam selecionados; a cor precisa de escolha explícita. A URL sem parâmetros abre o catálogo compartilhável. A entrada genérica direta do configurador usa `?view=quote` e destaca o 17 Pro Max 256 GB, oferecendo os outros produtos na mesma jornada. Navegar no catálogo não inicia uma tentativa de orçamento; a seleção de um modelo preserva a atribuição validada da URL.

Campo futuro de parâmetros de URL na Meta, a ser configurado pelo chat de mídia:

```text
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign=iphone17_pro_max_site&utm_content={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

Os placeholders devem ser resolvidos pela Meta. O site rejeita as chaves literais. QA usa IDs numéricos de teste iniciados em `990000`, interceptados e separados de tráfego comercial.

## Transporte e nomes exatos

Pixel **1430740015202870**, já existente em `index.html`. Único transporte Meta do funil: `fbq('trackSingleCustom', pixelId, nome, properties, { eventID })`. O `dataLayer` usa **o mesmo nome exato** da coluna de evento, com `event_id` correspondente. Não mapear uma segunda emissão Meta pelo GTM.

| dataLayer e Pixel | Gatilho | Deduplicação |
| --- | --- | --- |
| `IPhonePurchaseQuoteViewed` | Entrada na tentativa, após leitura do link/restauração | Uma vez/tentativa |
| `IPhonePurchaseQuoteStarted` | Primeira escolha/edição real ou avanço válido; link pré-selecionado não conta | Uma vez/tentativa |
| `IPhonePurchaseQuoteStepCompleted` | Avanço validado; `quote_step` identifica a tela | Uma vez/tentativa/tela |
| `IPhonePurchaseQuoteReviewed` | Resumo exibido após validação de todo o caminho aplicável | Uma vez/tentativa |
| `IPhonePurchaseQuoteWhatsAppClick` | Ação válida de abrir WhatsApp a partir da revisão, com destino configurado | Uma vez/tentativa |

Telas permitidas em `quote_step`: `product`, `payment`, `review`. StepCompleted só é emitido no avanço validado de `product` e `payment`; `review` tem evento próprio. Sem contexto de tela, o valor é `''`.

**Deixam de ocorrer:** `IPhoneTradeInStarted`, `IPhoneTradeInCompleted` e StepCompleted de `timing`, `trade`, `device`, `condition`, `history`. Nenhum marco é fabricado para compensar as remoções.

O evento final representa **intenção de abrir o WhatsApp**, não mensagem enviada/recebida, lead qualificado, compra ou receita. Copiar resumo não emite WhatsAppClick. O código não emite Lead, Purchase ou parâmetro padrão `value`.

## Payload permitido

Campos fixos: `quote_category=iphone_purchase`, `quote_tracking_version=1`, `quote_journey_version=2026-10-21.reduced-v1`. A versão da jornada distingue a simplificação sem renomear os eventos aplicáveis.

IDs internos: `quote_attempt_id`, `event_id` no dataLayer, `eventID` na opção do Pixel. IDs aleatórios de tentativa não entram na mensagem e não comprovam vínculo com conversa recebida.

Produto: `quote_initial_product`, `quote_selected_product` (formato de catálogo `modelId:capacity:condition`), `quote_variant_id`, `catalog_version`. O produto inicial é preservado enquanto o visitante consulta alternativas.

Origem: `quote_source`, `quote_medium`, `quote_campaign`, `quote_ad_id`, `quote_campaign_id`, `quote_adset_id`, correspondentes respectivamente a utm_source, utm_medium, utm_campaign, utm_content, campaign_id e adset_id. Fonte/meio vazios usam `unattributed`; outros IDs vazios usam `''`.

Preço: `catalog_cash_value`, `catalog_installment_value`, `catalog_installment_count=12`, `catalog_installment_total`, `currency=BRL`, apenas obtidos da variante de catálogo. Sem variante/cor definida, preços e quantidade ficam `null` e moeda `''`, limpando valores de uma oferta anterior.

Exemplo do 17 Pro Max 256 GB laranja: `7699.99`, `696.66`, `12`, `8359.88`, `BRL`. Esses números são oferta consultada, não conversão monetária. **Não há parâmetro padrão `value`.** Não há margem, crédito, saldo de troca, nome, telefone, bairro/CEP, bateria, histórico, bloqueio/conta, nota, mensagem, foto ou URL personalizada de WhatsApp nos eventos.

## Atribuição e deduplicação

UTM source/medium/campaign aceitam somente `[a-z0-9_-]` com até 80 caracteres. utm_content/campaign_id/adset_id aceitam somente 5–30 dígitos. Querys arbitrárias, placeholders, hashes e texto livre são excluídos. O template limpa a URL de compra antes de tags externas; a atribuição não usa UTM para preço ou seleção de produto. A exceção de `fbclid` está descrita abaixo e não faz parte dos seis campos personalizados.

### Preservação do fbclid — ajuste solicitado em 21/10/2026

O sanitizador anterior removia `fbclid` antes do Pixel. Agora preserva o valor recebido na URL quando não vazio e composto por letras ASCII maiúsculas/minúsculas, números, `_` e `-`. Essa é uma validação sintática da aplicação, não uma prova de autenticidade do clique. O valor não é truncado, normalizado para minúsculas, reconstruído a partir de UTM ou criado em visitas sem identificador. `URLSearchParams` pode normalizar a codificação da query; o valor decodificado permanece idêntico.

O identificador permanece na URL durante a visita, sem timeout nem limpeza posterior que dependa de suposta captura. Assim, continua disponível se o Pixel só puder ler a página depois, por carregamento lento ou permissão adiada. Links de produto, inclusive abertura em outra aba, e o retorno ao catálogo carregam o mesmo valor e as seis UTMs/IDs permitidas. A cópia do link compartilhável continua usando somente a canônica, sem atribuição individual.

O site deixa a captura e eventual `_fbc` a cargo do mecanismo legítimo do Pixel existente, respeitando bloqueios e consentimento do ambiente. Não escreve `_fbc`/`_fbp`, não instala outro Pixel e não cria backend, CAPI ou CRM. O código local não contém uma CMP/banner de consentimento; o ajuste não acrescenta `grant` nem contorna uma permissão negada. Permissões remotas e comportamento real de cookies devem ser validados no ambiente aplicável. Referência indicada no pedido: [Meta — fbp e fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/).

`fbclid` não entra no estado do tracker, rascunho, payload personalizado do Pixel/dataLayer ou mensagem de WhatsApp. Os cinco nomes de evento de compra aplicáveis, origem inicial, deduplicação, preços de catálogo e regras dos reparos são preservados. Os dois eventos de triagem foram desativados na jornada reduzida. O Pixel pode usar a URL atual no seu próprio mecanismo de atribuição; isso é distinto de acrescentar o identificador aos parâmetros personalizados.

QA usa um identificador explicitamente fictício somente em navegadores isolados com todos os transports Meta interceptados. O teste substitui o script por um observador e verifica a disponibilidade da URL quando ele é liberado e quando uma leitura é adiada por permissão simulada. Não escreve cookies `_fbc`, não demonstra captura pelo SDK real e não comprova transporte/recebimento na Meta. Visita sem identificador, valor inválido, query privada, navegação, Pixel bloqueado, storage bloqueado, rascunho, WhatsApp interceptado e deduplicação são cobertos em `npm run test:iphone-attribution-browser`.

As seis propriedades originais ficam separadas do produto final, com validade de duas horas por tentativa em sessionStorage próprio. Refresh/retorno sem nova origem preserva a origem anterior. Nova origem validada diferente em qualquer um desses campos abre nova tentativa e não reaproveita o rascunho da anterior. Um link de outro produto pode mudar a seleção, mas não reescreve a origem da tentativa ativa.

Cada marco tem chave persistida por tentativa; voltar/editar/reabrir/recarregar não recontam o mesmo marco. Sem storage, deduplicação apenas em memória na montagem atual; uma nova carga pode contar novamente. Marcos novos com Pixel indisponível ficam em pixelPending até aceitação pelo dispatcher do SDK, com o mesmo eventID. São feitas até 40 tentativas a cada 500 ms por janela; nova interação e retorno à visibilidade abrem outra janela limitada. Pendências sobrevivem ao reload na mesma tentativa válida, quando sessionStorage está disponível. Pendências de outro catálogo são descartadas para não reprecificar eventos históricos. Estados legados que têm somente sent não são reenviados. Aceitação pelo SDK não confirma transporte ou recebimento; bloqueio permanente continua respeitado. O WhatsApp abre imediatamente, sem aguardar o SDK. O evento de abertura não comprova que popup abriu, que o aplicativo funcionou ou que o cliente enviou a mensagem.

### Migração dos rascunhos

Mantida a chave `master-prime:iphone-purchase:v1` para ler os rascunhos legados, mas o objeto `draft.version` passa de 1 para 2. A restauração aceita ambas as versões e grava somente `selection`, `preferredColorIds`, `payment` e `paymentDetail`, todos revalidados. Prazo, escolha de troca e dados técnicos/notas do usado são descartados e removidos da próxima gravação; nunca entram no resumo novo.

Rascunhos nas telas removidas vão para Revisar se produto e pagamento estiverem válidos; caso contrário, para a primeira tela necessária (Seu iPhone ou Pagamento). Telas desconhecidas e catálogo alterado voltam ao produto. O aviso de alteração de tabela continua exigindo confirmação. Validade de duas horas, vínculo com tentativa/entrada e reinício por nova origem continuam vigentes.

O tracker mantém a chave/versão de storage e `attemptId`, origem inicial e os marcos compatíveis já emitidos: viewed, started, product/payment, reviewed e whatsapp. Descarta marcos das telas/eventos removidos. Abrir uma revisão migrada pode emitir Reviewed se nunca emitido; não produz StepCompleted retroativo. Se Reviewed/WhatsAppClick já ocorreram, não os repete. Sem storage, a deduplicação segue limitada à montagem atual.

## Captura global

Na rota de compra (catálogo e configurador), GTM continua desativado, incluindo seu fallback noscript no HTML pré-renderizado. Por autorização de 23/10/2026, o projeto Clarity existente `v6kk9ke9ye` volta a carregar pelo mesmo bootstrap global. Não há segundo projeto, identify, tags ou eventos personalizados de Clarity. O Pixel existente recebe `autoConfig=false` antes de init para impedir captura automática de botão/formulário; preserva seu PageView existente. Todo o formulário, incluindo ações, alternativas de produto, revisão e caixa de cópia, usa `data-clarity-mask="true"`; a máscara existente do fieldset é preservada. Nome, telefone e texto livre não são coletados nesta jornada. A limpeza de parâmetros privados e hash ocorre antes das tags externas. Não colocar dados pessoais em URLs, eventos, CSS ou identificadores.

As outras rotas preservam GTM, Clarity e Pixel. A configuração remota de GTM/Pixel e permissões externas não foi auditada por acesso à conta; a proteção local evita depender desses listeners nesta rota. `fbclid` permanece disponível na URL para o Pixel conforme a estratégia acima. O chat de mídia deve validar consentimento, captura e entrega no ambiente real. Como GTM não carrega nesta rota, o conteúdo de `dataLayer` sozinho não comprova recepção no GA4; GTM continua desativado; Clarity está reativado com máscaras. A CSP adicional de `/orcamento/iphone/:path*` permite o runtime `scripts.clarity.ms` e a imagem `c.clarity.ms`; a CSP global permanece idêntica. Sem novo grant de consentimento ou contorno de bloqueios. Referências: [instalação Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup), [mascaramento](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking) e [CSP](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp).

## Estado comercial e responsabilidade da mídia

- Catálogo: `2026-10-21.v2`, tabela fornecida em 21/10/2026; 13 variantes seminovas e 9 lacradas. Manutenção em `src/data/iphone-purchase.ts`.
- WhatsApp de vendas: **confirmado pelo usuário como o mesmo de orçamento de celular, +55 21 96763-5340** (`5521967635340`). A página usa `WHATSAPP_PHONE` compartilhado, sem variável de ambiente específica. CTA habilitado localmente; nenhuma mensagem de QA é enviada.
- Conta de anúncios de referência do briefing: `1271110088116287`. Não é configuração do formulário.
- Slug `iphone17_pro_max_site` é planejado; nenhuma campanha foi configurada/publicada por esta implementação.
- Preservados reparo `/orcamento/celular`, eventos `SmartphoneQuote*` e a referência histórica à conversão `2173738083498471`. Não reutilizar essa regra como conversão de compra de iPhone. Nenhuma conversão personalizada foi alterada/criada.
- Valor de lead, custo alvo, orçamento de mídia e ROAS não são definidos pelo site.

## Validação e publicação

A implementação e os testes da jornada reduzida estão descritos em `docs/iphone-purchase-qa.md`. O commit/publicação desta revisão será confirmado na entrega após os checks e a conclusão na Vercel. As URLs e a versão anterior `c7cbea8` já estavam publicadas antes desta simplificação.

O QA automatizado intercepta rede externa, Meta, clipboard e abertura do WhatsApp. Valida o contrato do evento e o acionamento da chamada de transporte; não executa o SDK real nem comprova transporte ou recebimento na Meta/GA4. Como GTM não carrega nesta rota, dataLayer sozinho não comprova recebimento no GA4. A tentativa de abrir o WhatsApp não prova envio ou recebimento de mensagem.

Pendências reais para a mídia: validar consentimento e rastreamento real/rota da conversão, recebimento no Gerenciador de Eventos e identificação da conversa no ambiente autorizado. A frase de origem pode ser alterada pelo cliente. Testes em aparelhos físicos e navegadores internos continuam separados da emulação. Nenhuma campanha, conversão, orçamento de mídia ou criativo foi criado/alterado; a configuração dos dois braços depende da aprovação específica descrita no pedido.

Confirmação comercial de 21/10/2026: o cartão aplica acréscimo único de 8,57% de 2 a 12 parcelas. O total considera valor à vista, acréscimo e arredondamento em centavos; não multiplica a parcela arredondada pela quantidade. Os campos de telemetria de catálogo continuam representando a referência de 12×. A revisão e a mensagem usam a quantidade escolhida e informam o ajuste na última parcela.
