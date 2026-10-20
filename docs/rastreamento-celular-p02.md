# Rastreamento do formulário de celular e teste P02

Implementação em 20/10/2026. Usuário autorizou publicação do site por commit/push e deploy automático da Vercel. A conclusão do deploy deve ser conferida para a revisão enviada; commit/push isoladamente não confirma publicação. Não houve criação, edição ou ativação de anúncios, conversões personalizadas ou tags no GTM nesta implementação.

## O que é medido

O formulário continua abrindo o WhatsApp com o resumo existente. O cliente ainda precisa enviar a mensagem. Não há cadastro de lead contatável no site e o novo rastreamento não transforma clique em contato, qualificado ou serviço.

O código usa o Pixel já instalado em `index.html`, ID `1430740015202870`, com eventos personalizados específicos de celular. Os eventos também ficam no `dataLayer` do GTM. Não foi criado outro Pixel nem usado o endpoint genérico `/api/meta-lead`.

| dataLayer | Pixel | Significado |
| --- | --- | --- |
| quote_viewed | SmartphoneQuoteViewed | Entrada na tentativa de orçamento |
| quote_started | SmartphoneQuoteStarted | Primeira interação com o formulário |
| quote_step_completed | SmartphoneQuoteStepCompleted | Grupo validado antes de avançar; quote_step 1 a 4 |
| quote_reviewed | SmartphoneQuoteReviewed | Revisão exibida com os campos obrigatórios completos |
| quote_whatsapp_click | SmartphoneQuoteWhatsAppClick | Ação válida para abrir WhatsApp com o resumo |

Cada marco é contado uma vez por tentativa; cada grupo concluído conta uma vez. Reabrir WhatsApp, editar, voltar ou atualizar não infla a mesma tentativa. `PageView` global mantém a contagem de páginas carregadas; `SmartphoneQuoteViewed` representa tentativas únicas, não todas as recargas. Um novo anúncio/campanha explícito inicia outra tentativa. Um rascunho restaurado pode chegar à revisão sem nova interação inicial; isso não deve ser interpretado automaticamente como perda de evento.

Estado em `sessionStorage`, chave `master-prime:smartphone-quote-tracking:v1`, separado do rascunho, válido por duas horas ao restaurar. Armazena apenas ID aleatório, criação, origem permitida e marcos enviados. Falha de storage mantém a proteção em memória enquanto a página está aberta; recargas sem storage podem iniciar nova tentativa. Pixel, Analytics e bloqueadores podem impedir coleta: sucesso local não garante recebimento externo.

## Propriedades permitidas

`quote_category=celular`, `quote_step`, `quote_attempt_id`, `event_id`, `quote_tracking_version=1`, `quote_source`, `quote_medium`, `quote_campaign`, `quote_ad_id`, `quote_campaign_id`, `quote_adset_id`.

Somente UTMs com tokens limitados e IDs Meta numéricos entram na origem. Outros parâmetros, fbclid, URL do WhatsApp, telefone, marca, modelo, localização, sintomas e texto livre não são enviados como propriedades. `fbclid` continua sob o comportamento do Pixel existente, sem reenvio manual pelo formulário. O estado de atribuição não recebe respostas do rascunho. Não usar dados pessoais em nomes de campanha/UTM. A URL da página e os dados que o próprio Pixel coleta continuam sujeitos à instalação existente.

IDs únicos são para correlação/deduplicação; não registrá-los como dimensões personalizadas de alta cardinalidade no GA4. Não adicionar tags que leiam texto de campos ou cliques genéricos de todos os elementos.

## GTM/GA4

O site envia os novos eventos Meta diretamente por `trackSingleCustom` ao Pixel existente. **Não duplicar esses eventos com tags Meta no GTM.** O componente não inicializa GA4/gtag nem inventa um Measurement ID.

Para receber no GA4 da empresa: confirmar a propriedade e o Google tag no container `GTM-P3RV75ZD`; configurar tag de evento GA4 para os cinco eventos acima, limitada a `quote_category=celular` e `quote_tracking_version=1`. Mapear apenas as propriedades necessárias. Conferir tags antigas que já respondam a `quote_*` para evitar eventos duplos. Não publicar importação cega sobre configuração desconhecida.

O evento final pode ser uma ação principal de **intenção de contato** no Analytics, com contagem intencionalmente documentada. Não renomeá-lo para lead qualificado/venda. Sem acesso ao container, essa configuração e o DebugView continuam pendentes.

## Preparar a campanha na Meta

1. Publicar o código revisado pelo fluxo normal do site e validar no destino real.
2. No Gerenciador de Eventos, selecionar `1430740015202870` e verificar os eventos específicos em Testar eventos. Apenas ver eventos Lead antigos não valida este funil.
3. Confirmar compartilhamento desse conjunto de dados com a conta `1271110088116287` e sua disponibilidade no editor. Em 20/10 ele aparecia no business, mas a consulta de datasets da conta retornava apenas outro ID. Não substituir o Pixel automaticamente.
4. Se o editor permitir otimizar por esse evento, criar conversão personalizada baseada em `SmartphoneQuoteWhatsAppClick`, limitada à categoria celular/página. Nome sugerido: **Celular — intenção de contato após formulário**. Evento de origem personalizado não é uma venda nem solicitação efetivamente recebida.
5. Criar campanha própria para a cópia P02-SITE, mantendo o original como referência. Usar Leads → Site com a conversão de intenção validada e descrição correta, se disponível. Se a primeira etapa for apenas um piloto de chegada à página, usar Tráfego → Site → visualizações da página de destino com prazo/verba definidos. Não decidir pelo CPC mais barato.
6. Reutilizar o vídeo P02, público comparável e destino `https://master-prime.com/orcamento/celular`. Ajustar a chamada para explicar a etapa no site. Configurações do conjunto original são referência, não garantia de opções idênticas em outro objetivo.
7. No campo de parâmetros de URL do anúncio, usar:

```text
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign=p02_site_celular&utm_content={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
```

Os IDs serão os da cópia nova. P02-SITE é uma identificação interna, sem código imposto à mensagem do cliente. UTMs ligam anúncio a visita; não garantem ligação automática com uma mensagem recebida, que precisa de evidência no atendimento.

## Verba e avaliação

Campanha de celular existente: R$35/dia compartilhados, sem verba fixa exclusiva do P02. Em20/10, usuário confirmou **sem verba adicional** e aceitou o plano: R$20/dia na campanha originalP01/P02 e R$15/dia na campanhaP02-SITE, total nominalR$35/dia. A divisão ainda não foi aplicada. Preserva parte maior da captação atual para um piloto exploratório; não é divisão validada por resultado comercial. Redução da original e início da nova serão coordenados na etapa de mídia, após publicar/testar o site e validar os eventos. Não iniciar a nova mantendo35naoriginal. Orçamento diário é referência nominal, não teto rígido de cobrança diária.

Verificar funcionamento nas primeiras 24–48h; comparar resultados comerciais em pelo menos sete dias completos, estendendo se a amostra for pequena. Prazo não determina vencedor sozinho. Medir gasto → visitas → inícios → grupos → revisão → intenção final → contatos recebidos → contatos úteis → serviços e margem. Fazer leitura diária antes do agregado e mesmas horas em dias incompletos.

Preservar originais evita perder a referência. Campanhas paralelas sem sorteio de audiência produzem comparação exploratória; mudar destino/otimização mede o pacote. Para isolar causalidade, configurar Experimentos A/B compatível com verba/opções da conta. Não automatizar decisões de status/orçamento.

## Verificação local e publicação

```sh
npm run lint
npm run typecheck
npm run build
npm test
PLAYWRIGHT_MODULE=file:///tmp/master-prime-p02-qa/node_modules/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome \
QUOTE_QA_BASE=http://127.0.0.1:4178 \
node docs/qa/smartphone-tracking/verify.mjs
```

O navegador de QA bloqueia tráfego externo e intercepta WhatsApp e Pixel. Confere eventos, reenvios, persistência de origem, nova campanha, dados pessoais e falha de storage/tags sem enviar mensagens reais. Validar em aparelhos físicos e confirmar recebimento no Meta/GA4 em produção ainda são passos separados. Reversão: reverter alterações do tracker e seus pontos de integração; formulário e mensagens não precisam mudar.

Resultado local de 20/10: lint, typecheck, build, suíte completa e auditoria SEO aprovados. Os dois cenários de navegador passaram em Chromium e WebKit; evidências de execução em `docs/qa/smartphone-tracking/results.json`. Não houve submissão real ao WhatsApp nem envio dos novos eventos ao Meta nos testes.

Índice de prontidão da skill analytics-tracking após a remediação local: 81/100, provisório (decisão 23/25, modelo 18/20, integridade 10/20, conversão 14/15, atribuição 8/10, governança 8/10). Faixa Usable with Gaps; não é nota de desempenho ou autorização para investir. A lacuna principal é validar recebimento real, configuração de tags/permissões e acompanhamento comercial após publicação.
