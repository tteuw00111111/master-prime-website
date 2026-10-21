# Handoff — compra de iPhone no site

Preparado em 21/10/2026. **Commit e push autorizados pelo usuário; deploy ainda não confirmado por este documento. Nenhum evento novo foi confirmado no Gerenciador de Eventos.**

## URLs preparadas

- Canônica planejada: `https://master-prime.com/orcamento/iphone`.
- Link inicial: `https://master-prime.com/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed`.
- Alternativa: `https://master-prime.com/orcamento/iphone?model=iphone-17-pro-max&capacity=512&condition=sealed`.
- As URLs públicas são planejadas para a publicação autorizada, não uma afirmação de que já estão no ar. Localmente usar o mesmo caminho no servidor de desenvolvimento/preview.
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
| `IPhoneTradeInStarted` | Primeira interação com informação do usado | Uma vez/tentativa |
| `IPhoneTradeInCompleted` | Revisão exibida com triagem reconhecida elegível e campos mínimos válidos | Uma vez/tentativa |
| `IPhonePurchaseQuoteReviewed` | Resumo exibido após validação de todo o caminho aplicável | Uma vez/tentativa |
| `IPhonePurchaseQuoteWhatsAppClick` | Ação válida de abrir WhatsApp a partir da revisão, com destino configurado | Uma vez/tentativa |

Telas permitidas em `quote_step`: `product`, `payment`, `timing`, `trade`, `device`, `condition`, `history`, `review`. StepCompleted nunca é emitido para `review`; o resumo tem evento próprio. Quando não há contexto de tela, o valor é `''`. Não é usado um enum restrito de reparo.

`IPhoneTradeInCompleted` não é aprovação. Modelos desconhecidos e política pendente para compra de outros produtos não emitem esse marco. O evento final representa **intenção de contato**, não mensagem recebida, lead, qualificação, compra ou receita. Copiar resumo não emite WhatsAppClick.

## Payload permitido

Campos fixos: `quote_category=iphone_purchase`, `quote_tracking_version=1`.

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

`fbclid` não entra no estado do tracker, rascunho, payload personalizado do Pixel/dataLayer ou mensagem de WhatsApp. Os sete nomes de evento, origem inicial, deduplicação, preços de catálogo e regras dos reparos permanecem iguais. O Pixel pode usar a URL atual no seu próprio mecanismo de atribuição; isso é distinto de acrescentar o identificador aos parâmetros personalizados.

QA usa um identificador explicitamente fictício somente em navegadores isolados com todos os transports Meta interceptados. O teste substitui o script por um observador e verifica a disponibilidade da URL quando ele é liberado e quando uma leitura é adiada por permissão simulada. Não escreve cookies `_fbc`, não demonstra captura pelo SDK real e não comprova transporte/recebimento na Meta. Visita sem identificador, valor inválido, query privada, navegação, Pixel bloqueado, storage bloqueado, rascunho, WhatsApp interceptado e deduplicação são cobertos em `npm run test:iphone-attribution-browser`.

As seis propriedades originais ficam separadas do produto final, com validade de duas horas por tentativa em sessionStorage próprio. Refresh/retorno sem nova origem preserva a origem anterior. Nova origem validada diferente em qualquer um desses campos abre nova tentativa e não reaproveita o rascunho da anterior. Um link de outro produto pode mudar a seleção, mas não reescreve a origem da tentativa ativa.

Cada marco tem chave persistida por tentativa; voltar/editar/reabrir/recarregar não recontam o mesmo marco. Sem storage, deduplicação apenas em memória na montagem atual; uma nova carga pode contar novamente. Tags indisponíveis não são reenviadas retroativamente: evitar duplicação não garante entrega. O evento de abertura não comprova que popup abriu, que o aplicativo funcionou ou que o cliente enviou a mensagem.

## Captura global

Na nova rota, GTM e Clarity não são carregados, incluindo fallback noscript no HTML pré-renderizado. O Pixel existente recebe `autoConfig=false` antes de init para impedir captura automática de botão/formulário; preserva seu PageView existente. O formulário e a revisão também estão mascarados.

As outras rotas preservam GTM, Clarity e Pixel. A configuração remota de GTM/Pixel e permissões externas não foi auditada por acesso à conta; a proteção local evita depender desses listeners nesta rota. `fbclid` permanece disponível na URL para o Pixel conforme a estratégia acima. O chat de mídia deve validar consentimento, captura e entrega no ambiente real. Como GTM não carrega nesta rota, o conteúdo de `dataLayer` sozinho não comprova recepção no GA4; GTM e Clarity não foram reativados neste ajuste.

## Estado comercial e responsabilidade da mídia

- Catálogo: `2026-10-21.v2`, tabela fornecida em 21/10/2026; 13 variantes seminovas e 9 lacradas. Manutenção em `src/data/iphone-purchase.ts`.
- WhatsApp de vendas: **confirmado pelo usuário como o mesmo de orçamento de celular, +55 21 96763-5340** (`5521967635340`). A página usa `WHATSAPP_PHONE` compartilhado, sem variável de ambiente específica. CTA habilitado localmente; nenhuma mensagem de QA é enviada.
- Conta de anúncios de referência do briefing: `1271110088116287`. Não é configuração do formulário.
- Slug `iphone17_pro_max_site` é planejado; nenhuma campanha foi configurada/publicada por esta implementação.
- Preservados reparo `/orcamento/celular`, eventos `SmartphoneQuote*` e a referência histórica à conversão `2173738083498471`. Não reutilizar essa regra como conversão de compra de iPhone. Nenhuma conversão personalizada foi alterada/criada.
- Valor de lead, custo alvo, orçamento de mídia e ROAS não são definidos pelo site.

## Validação: separar quatro estados

1. **Implementação local:** catálogo, formulário, triagem, eventos e testes implementados. Detalhes/evidências em `docs/iphone-purchase-qa.md`.
2. **Publicação:** commit e push autorizados em 21/10/2026; verificar a conclusão do deploy no provedor.
3. **Transporte real de evento:** não validado; QA intercepta Pixel, rede externa, clipboard e abertura de WhatsApp. Mocks validam contrato e gatilhos, não conectividade com a Meta.
4. **Recebimento no Gerenciador de Eventos:** não consultado/confirmado. Validar com acesso autenticado após publicação autorizada. Configuração de campanha/conversão pertence ao chat de mídia.

Pendências: confirmação atual da tabela antes de publicação; eventual política de troca em outros produtos; condições de venda ainda não fornecidas; testes em aparelhos físicos e navegadores internos; validação externa de privacidade/transporte/recebimento com responsável de mídia. Não é necessário contratar CRM, central, bot ou serviços adicionais para usar o fluxo.

A revisão solicitada pelo usuário inclui pagamento restrito a À vista (Pix ou Cartão) e Cartão de crédito (12 parcelas confirmadas), prazo obrigatório em tela `timing`, e lista de cor do usado. Esses dados continuam fora do payload de publicidade. `quote_step=timing` acrescenta um marco deduplicado por tentativa; os nomes e a versão de tracking permanecem os mesmos, ainda sem publicação ou validação externa. A etapa inicial mostra apenas à vista/12×; totais do catálogo continuam na revisão, mensagem e campos de telemetria já definidos.

Confirmação comercial de 21/10/2026: o cartão aplica acréscimo único de 8,57% de 2 a 12 parcelas. O total de catálogo considera o valor à vista com esse acréscimo e arredondamento em centavos; não usa a multiplicação da parcela arredondada. Os campos de telemetria de catálogo continuam representando a referência de 12×. A revisão e a mensagem usam a quantidade escolhida e informam o ajuste de centavos na última parcela.
