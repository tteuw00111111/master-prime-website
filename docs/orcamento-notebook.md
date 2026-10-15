# Orçamento de notebook — primeira versão

## Escopo e acesso

- Página pública `/orcamento/notebook`, inicialmente exclusiva para notebook. `/orcamento`, `/orcamento/` e `/orcamento/index.html` redirecionam temporariamente (302), preservando parâmetros, no Vercel, no dev e no preview. A rota genérica fica reservada ao futuro seletor de categorias. Entrada principal nas dez páginas do cluster de notebook; contato direto pelo WhatsApp continua disponível.
- Cinco etapas: identificação → sintomas/solicitações → detalhes opcionais → preferência de atendimento → revisão.
- Marca/modelo pesquisáveis, marca e modelo desconhecidos, entrada livre, seleção múltipla e perguntas condicionais. Limpeza e consulta de upgrade aparecem como solicitações próprias.
- Retirada/entrega pede bairro e cidade; o endereço completo e as condições ficam para o WhatsApp. Não há aprovação automática de região, taxa ou horário.
- Sem preço automático, cadastro, upload ou banco de pedidos. O usuário envia o resumo na conversa; abrir o WhatsApp não comprova envio.
- Rascunho em `sessionStorage`, na mesma aba, com validade de duas horas. Falha ou indisponibilidade de storage não bloqueia o formulário.

## Interface

Fluxo guiado com uma pergunta por vez: marca → modelo → problemas/solicitações → perguntas condicionais opcionais → observações → atendimento → bairro → cidade (somente retirada/entrega) → revisão. O indicador mantém cinco grupos para comunicar progresso sem criar URLs por pergunta.

Composição centralizada e aberta, PT-BR, Britanica, preto e dourado. O botão final usa verde para o WhatsApp. A seleção é confirmada com “Continuar”, sem avançar automaticamente nem abrir o teclado. “Voltar” preserva as respostas. Erros validam somente a pergunta atual e focam o campo correspondente. Controles têm alvo mínimo de 48 px; inputs usam 16 px; foco visível, área segura e acomodação do teclado continuam presentes.

Cada pergunta opcional aparece isoladamente; “Pular detalhes” mantém respostas e observações já preenchidas. Edições a partir da revisão percorrem apenas o grupo escolhido e voltam ao resumo. A escolha de retirada abre bairro e cidade em perguntas separadas; troca para loja remove a localização da mensagem.

Foram removidos o texto introdutório repetido, a coluna decorativa, as descrições redundantes de sintomas e os avisos que ensinavam a rolar e pressionar o próximo botão. “Como funciona o orçamento?” fica em uma seção expansível. Ajuda do modelo, atribuição Icecat, condições de retirada e ressalva de avaliação permanecem disponíveis.

Por solicitação do usuário, não há rolagem automática, animação de entrada ou transições deslizantes. Foco usa preventScroll; somente o navegador controla a rolagem durante o teclado. Botões mantêm resposta direta ao toque. Durante a digitação, o título fica compacto, o subtítulo repetido sai e o rodapé de ações fica oculto, deixando espaço para o campo e sugestões. O Done do teclado continua disponível; as ações reaparecem ao encerrar a digitação. Não há deslocamento programado do rodapé para cima do teclado. A borda de foco é neutra e discreta, sem brilho amarelo.

O rascunho grava imediatamente a pergunta atual e o contexto de edição, além dos dados existentes. Aceita rascunhos anteriores com cinco etapas e não permite restaurar uma posição posterior a um campo obrigatório incompleto. O conteúdo inicial, pergunta da marca e contato sem JavaScript continuam pré-renderizados; as demais perguntas aparecem conforme a navegação.

Decisões e evidências desta revisão: [fluxo guiado](qa/notebook-guided/DESIGN.md).

## Catálogo gratuito

Fonte: [Open Icecat](https://icecat.com/content-subscription/). Importação determinística de identificadores, marcas e nomes, sem processamento generativo de dados. A conta e o API Access Token são usados somente no importador local.

```sh
cp .env.icecat.example .env.icecat.local
# Preencher ICECAT_API_TOKEN no arquivo local.
npm run catalog:import
```

O arquivo local é ignorado pelo Git. Nenhuma credencial usa prefixo `VITE_`, integra o bundle ou é solicitada ao navegador do cliente. O servidor de desenvolvimento também bloqueia o acesso ao arquivo de ambiente.

O importador baixa o índice BR e referências oficiais, confirma a categoria Laptops, descarta conteúdo restrito e registros de teste/revenda, agrupa nomes normalizados iguais e preserva códigos originais como aliases. Aceita índice gzip já baixado com `--index /caminho/arquivo.xml.gz`. O cache local fica em `.cache/icecat`, fora do Git; arquivos de menos de 24 horas são reutilizados.

A publicação gera:

- `public/catalog/notebooks.json`: índice pequeno de marcas e arquivos.
- `public/catalog/notebooks/`: dados por marca, em JSON e gzip; o navegador baixa apenas a marca selecionada. Usa descompressão nativa quando disponível e mantém fallback JSON.
- `public/catalog/coverage.json`: contagem e cobertura da importação real.
- `public/catalog/icecat-license.txt`: licença original, atribuição, alterações e ausência de garantia.

Arquivos recebem hash; o manifest é publicado por último e versões antigas são removidas após sucesso. Falhas de importação mantêm o manifest anterior. Catálogos não dependem da API durante o preenchimento; falhas de download no cliente permitem continuar com modelo digitado.

### Limites de cobertura

BR é o idioma do índice, não comprovação de venda no Brasil. Um nome pode identificar uma família ou uma configuração; a contagem não representa necessariamente chassis distintos. A cobertura gratuita é parcial, sobretudo para marcas/modelos fora do conjunto liberado pelo fornecedor. A presença de uma marca não é promessa de reparo, peça em estoque ou autorização pelo fabricante. Marcas brasileiras e Apple continuam aceitando entrada livre quando não há sugestão disponível.

A importação é manual nesta primeira versão; a data e as contagens ficam em `coverage.json`. Atualizações não entram automaticamente no build e não exigem expor o token no site. Não foram criados agendamento externo, conta paga ou automação em serviços de terceiros.

Snapshot inicial: 226.114 nomes de modelos/configurações, 36 marcas na fonte gratuita, após agrupamento e revisão de rótulos. O manifest tem cerca de 8 KB; os arquivos comprimidos somam aproximadamente 8 MB e são carregados por marca, não em conjunto. A fonte não liberou sugestões para todas as marcas do formulário.

## WhatsApp e dados

O resumo contém aparelho, marca/modelo, sintomas/solicitações, respostas opcionais e preferência de atendimento. Bairro/cidade só entram na mensagem quando a preferência final é retirada/entrega. Respostas de sintomas removidos são descartadas. O telefone comercial permanece o existente no projeto.

A URL personalizada é construída apenas no clique, sem aparecer em `href` no documento. O rastreamento usa somente `quote_started`, `quote_step_completed`, `quote_reviewed` e `quote_whatsapp_click`, com categoria e número da etapa. Não envia mensagem, URL personalizada, localização, texto livre ou dados de contato ao `dataLayer`. O conteúdo do formulário usa máscara para Clarity. Os demais CTAs e eventos existentes continuam usando sua integração atual.

O clique abre uma conversa com texto preenchido; o cliente ainda precisa enviá-lo. A página oferece abrir novamente e copiar o resumo. Em navegadores sem Clipboard API, mostra texto selecionável para cópia manual.

## SEO e compatibilidade

`/orcamento/notebook` tem H1, title, description, canonical, breadcrumb, WebPage e vínculo ao Service de notebook e à entidade LocalBusiness existente. Entra no sitemap com HTML pré-renderizado. As etapas não geram URLs novas. Arquivos de catálogo recebem `X-Robots-Tag: noindex` na configuração Vercel.

NAP, telefone, e-mail, horários, páginas existentes, robots e política de GPTBot foram preservados. Outros serviços continuam no fluxo anterior. Não há preços, prazo, garantia, rating/review schema ou novos serviços publicados por esta alteração.

## Verificação

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`: testes de regras, mensagens, privacidade, rascunho, busca, integridade dos catálogos e auditoria SEO.

Verificações de navegador executadas com Chrome/Playwright: mobile 390 px e desktop 1440 px; CTA mobile visível; validações; vários sintomas; perguntas condicionais; retirada/entrega; edição; persistência; URL WhatsApp com acentos; eventos sem texto livre. A navegação até o WhatsApp é interceptada nos testes, sem enviar mensagens.

Axe verificou WCAG 2 A/AA e 2.1 AA no cabeçalho e área do formulário nas cinco etapas. Isso complementa, mas não substitui, teste com pessoas e aparelhos reais. Não foi feito teste de conversão nem publicação em produção.

Resultado final: lint, typecheck, build, oito testes de regras/integridade e auditoria SEO de 33 URLs aprovados. O build gerou 32 páginas React e preservou a política de privacidade. Testes adicionais cobriram busca no catálogo grande comprimido, troca de marca, cópia manual em HTTP na LAN e HTML com/sem JavaScript em 320, 390 e 1440 px, sem overflow horizontal. Uma varredura não encontrou o token nos arquivos públicos nem nos bundles.

O preview serve o HTML pré-renderizado também na URL limpa `/orcamento/notebook`, sem exigir barra final. As três variantes da rota antiga retornam 302; apenas a nova rota entra no sitemap. A rota antiga retornava 404 em produção antes desta alteração; Search Console e dados externos de backlinks não estavam disponíveis nesta sessão.

Verificação do refinamento mobile: fluxo completo e Axe nas cinco etapas em 320, 390, 430 e 1440 px; foco dos erros por campo; pulo preservando observações/respostas; edição e retorno direto à revisão; restauração sem orientação automática; teclado com viewport reduzido simulado; WhatsApp somente por clique e sem texto livre no tracking. Testes adicionais cobrem toque com animação normal, seleção por teclado sem orientação, cancelamento por rolagem manual, marca própria/Next, modelo livre/Done, sugestão por alias e falha do catálogo. Chrome headless não reproduz o teclado físico de iOS/Android; ainda cabe uma conferência em aparelho real pela LAN.

Refinamento da primeira dobra: opções de marca visíveis acima das ações fixas em 320×480, 375×540, 390×620 e 430×700; desktop também revisado. Amostragem da animação confirmou deslocamento gradual com aceleração/desaceleração. Interrupção durante movimento ativo, Next de marca própria e redução de movimento foram verificados no navegador. A moldura de foco do grupo de marca foi reproduzida e removida, preservando o contorno de teclado nos botões.
