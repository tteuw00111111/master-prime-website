# Orçamento de compra de iPhone

Implementação de 21/10/2026. Fonte comercial: briefing `PROMPT-SITE-ORCAMENTO-IPHONES.md` fornecido pela empresa nesta tarefa e confirmações posteriores de modelos, preços e parcelamento. O usuário autorizou revisão, commit e push em 21/10/2026. A conclusão de deploy deve ser verificada no provedor; não houve envio real de mensagem, alteração de campanha ou contratação.

## Rota e experiência

- Rota única: `/orcamento/iphone`. Compra de produto tem intenção distinta de `/orcamento/celular`, que continua atendendo reparos.
- Entrada pelo anúncio: `/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed`.
- Entrada do 18 Pro Max (256 GB): `/orcamento/iphone?model=iphone-18-pro-max&capacity=256&condition=sealed`. Preto, Bordô e Prateado têm galeria e 3D próprios, conforme pacote fornecido.
- Alternativa de 512 GB: `/orcamento/iphone?model=iphone-17-pro-max&capacity=512&condition=sealed`.
- `model`, `capacity` e `condition` são identificadores validados contra o catálogo. Nenhum parâmetro define preço, estoque ou elegibilidade. Não existe pré-seleção de cor por URL.
- A rota sem parâmetros abre o catálogo compartilhável de lacrados e seminovos, com filtros, preços e cópia do link. Links com `model` continuam entrando no configurador. A entrada genérica direta do configurador usa `?view=quote` e destaca o 17 Pro Max de 256 GB sem cor selecionada. As variantes de 512 GB ficam no seletor principal de capacidade. Detalhes do hub em `docs/iphone-catalog-design.md`.
- Preço à vista e valor de cada uma das 12 parcelas aparecem por cor antes de qualquer pergunta sobre o interessado. O total parcelado aparece na etapa de pagamento, na revisão e na mensagem. Não há cadastro, nome, CPF, endereço, telefone ou login.
- Etapas: produto, pagamento, prazo de compra obrigatório em tela própria, troca opcional e revisão. Para aparelhos de troca reconhecidos, a descrição acrescenta aparelho/bateria, estado externo e funcionamento. A restrição comercial do 17 Pro Max continua aplicada; nos demais produtos, a política de troca permanece a confirmar.
- Pagamento: somente À vista ou Cartão de crédito. À vista exige escolher Pix ou Cartão; crédito permite escolher de 2 a 12 parcelas. Conforme confirmação da Master Prime em 21/10/2026, todas as opções têm acréscimo único de 8,57% sobre o valor à vista. Cada opção mostra o valor da parcela. O total é arredondado em centavos e permanece igual de 2× a 12×; diferenças de divisão são ajustadas e informadas na última parcela. A quantidade escolhida é preservada no rascunho, na revisão e no resumo para o WhatsApp. Não há boleto ou decisão de pagamento pelo WhatsApp.
- Seminovos: imagens de referência por modelo, sem 3D; escolha múltipla de cores aceitáveis, com opção de aceitar todas. A preferência não muda o preço e a equipe confirma disponibilidade/condição no WhatsApp. Nenhuma cor vem marcada pela imagem inicial.
- Revisão editável, com pagamento e prazo em blocos separados. O botão principal abre o WhatsApp no número confirmado do orçamento de celular; o cliente precisa enviar a mensagem na conversa. A cópia é alternativa, com caixa selecionável se a API de clipboard falhar.

O HTML principal é pré-renderizado. A rota tem title, description, H1, canonical sem query, breadcrumb e link natural na seção de orçamento da home. O sitemap inclui somente a rota canônica. O JSON-LD utiliza a entidade LocalBusiness existente, WebPage e BreadcrumbList; não apresenta a compra como serviço de reparo e não cria Offer/estoque ou estrelas.

## Triagem do usado

Na compra do 17 Pro Max, a escolha é reconhecida pelo catálogo Apple de `src/data/smartphone-models.ts`, já documentado no repositório. A restrição comercial da compra do 17 Pro Max continua: somente aparelhos reconhecidos da linha 15 em diante (incluindo iPhone Air do catálogo) entram nessa triagem. Um número digitado não torna o aparelho elegível. Nas compras dos demais modelos, qualquer iPhone reconhecido no catálogo pode ser descrito no mesmo questionário, sem confirmação de aceitação.

Modelos anteriores explicam a limitação e oferecem continuação sem troca. Modelo desconhecido pede esclarecimento e segue como consulta de possibilidade, sem evento de triagem concluída. Compras de outros modelos mostram as mesmas perguntas de bateria, aparência, reparos e peças trocadas, mas continuam como consulta, pois sua política de troca não foi definida. O resumo mantém a política a confirmar junto das informações declaradas. Nenhum dos caminhos calcula crédito, saldo ou aprovação.

Perguntas aceitam desconhecimento. Saúde da bateria aceita inteiro de 0 a 100 ou “Não sei”, sem corte de aceitação. Reparos têm campos condicionais, sem declaração obrigatória de originalidade. As notas aceitam até 600 caracteres. Não são pedidos senha, conta, IMEI, série, upload ou procedimentos de remoção de bloqueio. A cor do usado é uma lista de cores declaradas, incluindo Outra cor e Não sei, sem relação com estoque da loja. As respostas só entram no rascunho local e no resumo destinado ao WhatsApp.

## Manutenção comercial em um único arquivo

Edite `src/data/iphone-purchase.ts`:

1. Atualize os valores inteiros de `usedRows` e `sealedRows`, em **centavos**. As parcelas são calculadas em `src/utils/iphone-pricing.ts` com o acréscimo único confirmado de 8,57%. O total vem de `getIPhoneInstallmentPlan().totalCents`, incluindo o ajuste de centavos na última parcela; não multiplique a parcela arredondada pela quantidade para obter o total.
2. Atualize `IPHONE_CATALOG_VERSION` e `IPHONE_CATALOG_DATE_LABEL` quando a empresa fornecer uma nova tabela. Não é necessário editar componentes para atualizar preços ou a data exibida.
3. Para tirar uma variante de consulta, inclua seu ID em `unavailableVariantIds`. Retire-o quando a empresa confirmar que pode voltar a receber consultas. `consult` significa consultar disponibilidade; não significa estoque confirmado ou pronta entrega.
4. Para novos modelos/capacidades/condições, acrescente uma linha somente com fonte comercial. Os IDs existentes são estáveis. Se mudar o destaque padrão, atualize também `createIPhonePurchaseDraft()` no mesmo arquivo e o link de anúncio com a equipe de mídia.
5. Seminovos permitem marcar múltiplas cores aceitáveis com base nas referências do modelo; disponibilidade e estado individual são confirmados pela equipe. O preço não muda com a preferência de cor. Não acrescente bateria mínima, acessórios ou histórico presumidos.
6. Rode lint, typecheck, build, testes e QA de navegador. Os testes de tabela devem ser atualizados a partir da nova fonte comercial, preservando uma comparação independente dos valores publicados.

O rascunho guarda uma impressão da tabela (IDs, preço à vista, parcela, condição no ID, disponibilidade, cor e versão). A restauração compara com o catálogo carregado. Se houver diferença, retorna ao produto e exige reconhecer o aviso antes de avançar. Recarregar novamente não apaga essa pendência. Variantes removidas/incompatíveis são revalidadas. O resumo usa somente os preços atuais do catálogo carregado, nunca preços salvos do visitante.

Limite: o catálogo é estático e passa a valer após um novo build/publicação. Uma aba aberta com o bundle anterior não busca mudanças futuras em tempo real. Confirmar os preços com a equipe continua necessário.

## Rascunho, atribuição e privacidade

Rascunho: `master-prime:iphone-purchase:v1`. Rastreamento: `master-prime:iphone-purchase-tracking:v1`. Ambos usam sessionStorage separado dos reparos, com limite de duas horas; a atribuição vence a partir da criação da tentativa, e o rascunho a partir de seu salvamento. Novo anúncio/campanha validado inicia nova tentativa e descarta o rascunho da anterior. Entrada de produto diferente substitui a seleção quando a assinatura de entrada muda; o produto de origem permanece no tracker.

Sem storage, o formulário continua funcionando em memória. A deduplicação sobrevive a edições na mesma montagem, mas não é garantida após recarregar. Tags bloqueadas não impedem orçamento/cópia/abertura. Depois de carregar a página, é possível preencher e copiar sem rede; não há service worker nem promessa de primeiro acesso offline. O WhatsApp precisa de rede.

O repositório carrega GTM `GTM-P3RV75ZD`, Clarity e o Pixel globalmente. Nesta rota, `index.html` impede carregar GTM e Clarity, para eliminar listeners de clique externos e gravação da triagem. A pré-renderização também remove os fallbacks noscript desses transportes nesta rota. `autoConfig` do Pixel é desativado antes do init nela. A inicialização do Pixel e seu PageView já existentes são preservados; não há segundo Pixel. As outras páginas mantêm as integrações existentes.

Antes dos scripts externos, a URL de compra é limpa para manter apenas os parâmetros limitados de produto, as seis UTMs/IDs explícitas e o `fbclid` recebido com caracteres permitidos. O identificador do clique mantém seu conteúdo e caixa, inclusive na navegação entre catálogo e configurador, para continuar disponível ao Pixel existente após carregamento lento ou consentimento adiado. Não há timeout de remoção, composição manual de cookies ou geração de identificador quando ausente. Dados livres, hashes, preço e campos pessoais são removidos. `fbclid` fica fora dos eventos personalizados, rascunho e WhatsApp; detalhes e limites em `docs/iphone-purchase-handoff-meta-ads.md`. A configuração remota e a captura real pela Meta não são comprovadas pelos testes interceptados. GTM continua ausente na rota; dataLayer sozinho não comprova entrega ao GA4.

Todo o formulário e o resumo usam `clarity-mask` e `data-clarity-mask`. Não há novo mecanismo de consentimento ou captura contatável; o tracker apenas tenta o Pixel existente, sem contornar bloqueadores. A implantação deve preservar qualquer bloqueio/consentimento do ambiente. Não foram usados `/api/meta-lead`, Lead, Purchase, CAPI, Tintim, GTM/GA4 novos ou integração de WhatsApp.

## Destino do WhatsApp e publicação

**Confirmado pelo usuário nesta revisão:** usar o mesmo número do orçamento de celular, **+55 21 96763-5340**. A página importa a constante compartilhada `WHATSAPP_PHONE` de `src/utils/whatsapp.ts`; não modifica os demais destinos.

Não é necessária variável de ambiente específica para iPhones. A autorização atual substitui a pendência do briefing inicial. Nenhuma mensagem é enviada automaticamente pelo site ou pelos testes.

Para a publicação autorizada pelo usuário em 21/10/2026 e a manutenção posterior:

1. Confirmar tabela atual e política de triagem, inclusive qualquer extensão a outros produtos. O destino de vendas já foi confirmado pelo usuário.
2. Revisar modelos/nomes/cores com a loja se a tabela for alterada. A tabela fornecida inclui iPhone 18 Pro Max; a implementação mantém a denominação fornecida, sem inventar especificações ou fotos.
3. Confirmar comercialmente garantia, acessórios, nota fiscal, entrega, estoque individual e eventual validade da oferta antes de comunicar essas condições. Elas não são prometidas nesta página.
4. Reexecutar QA e revisar alterações antes de commit/push. A autorização de commit e push foi dada em 21/10/2026; isso não comprova que o provedor concluiu o deploy.
5. Após publicação autorizada, validar a URL, transporte dos eventos, deduplicação e recebimento externo com o responsável de mídia. O teste local não comprova recebimento na Meta.

Fotos/vídeo da pasta de criativos não foram usados como prova de estoque ou condição individual. A interface utiliza os renders fornecidos pelo usuário, mapeados por modelo e cor em `src/data/iphone-product-images.ts` e `src/data/iphone-used-product-images.ts`, com proveniência nos arquivos `sources.json`. Lacrados oferecem fotos e 3D adaptativo; seminovos usam apenas imagens de referência. Fotografias reais das unidades devem substituir as referências quando fornecidas e verificadas.

## Aplicação de mobile-design

Web existente, React 18/Vite; navegadores iOS/Android, incluindo navegador interno do Instagram/Facebook, além de tablet/desktop. Navegação por etapas aproveita o padrão existente, com botões visíveis de voltar/editar. Sem novos gestos, stack nativa ou framework.

Referências lidas: mobile-design-thinking, touch-psychology, mobile-performance, mobile-backend, mobile-testing, mobile-debugging, platform-ios e platform-android. Princípios: alvos de 48 px, uma ação principal por etapa, teclado/cópia/interrupções tratados sem rede obrigatória para editar. Evitados: vídeo obrigatório, cor pré-selecionada, campos pequenos, ações somente por gesto e cadastro antes dos preços.

MFRI adaptado à web: clareza de plataforma 5 + acessibilidade preparada 5 − complexidade 2 − performance 1 − dependência offline 2 = **5**, exigindo validação de UX e performance. Nenhum resultado de emulação é apresentado como teste em aparelho físico.

Arquivos principais: `IPhonePurchaseQuotePage.tsx`, `IPhonePurchaseFields.tsx`, `iphone-purchase.css`, tipos/dados/helpers `iphone-purchase*`, além das integrações de App, SEO, home, template e pré-renderização. O contrato de mídia está em `docs/iphone-purchase-handoff-meta-ads.md`; evidências e comandos em `docs/iphone-purchase-qa.md`.

Rascunhos da versão anterior são revalidados: pagamento sem tipo à vista/quantidade de parcelas retorna a Pagamento; prazo vazio retorna à nova etapa obrigatória. Não é feita escolha silenciosa de Pix, cartão ou prazo. Trocar a forma de pagamento limpa o detalhe incompatível.
