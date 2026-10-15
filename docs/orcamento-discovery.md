# Área de orçamento — pesquisa e proposta

Data: 15/10/2026. Registro histórico da etapa de descoberta. A rota atual do piloto é `/orcamento/notebook`; `/orcamento` redireciona temporariamente até a entrada de outras categorias. A implementação posterior foi recortada para notebook primeiro; veja [a documentação da primeira versão](orcamento-notebook.md).

## Direção recomendada

Criar uma área própria no mesmo site, com um formulário guiado para celular, notebook, videogame e controle. Organizar o pedido antes de continuar o atendimento no WhatsApp. Tratar o resultado como **solicitação de orçamento**, com condições confirmadas pela equipe após entender o caso; valores automáticos exigem uma tabela comercial validada que não foi encontrada no repositório.

**Público confirmado pelo usuário: clientes finais.** A área proposta é `/orcamento`, com linguagem de sintomas e passagem ao atendimento da Master Prime. Não é um portal de técnicos ou parceiros.

## Referências de mercado

Referências selecionadas pela utilidade dos padrões de interação, sem afirmar liderança, participação de mercado ou superioridade de conversão. Foram consultados conteúdos públicos; não foram concluídos agendamentos, compras ou atendimentos. Responsividade e facilidade real de uso ainda precisam de teste visual e com usuários.

| Referência | Padrão observado | Aplicação proposta para Master Prime |
| --- | --- | --- |
| [Samsung Brasil — reparo](https://www.samsung.com/br/support/valorreparo/) | Categoria → busca de modelo/série → sintoma → opções de atendimento. Oferece contato quando o aparelho não está listado. | Melhor referência para escolhas dependentes e busca de modelo; manter uma saída para modelos desconhecidos. |
| [Apple Brasil — reparo de iPhone](https://support.apple.com/pt-br/iphone/repair) | Seletor de aparelho/modelo, estimativa para serviços comuns e confirmação após inspeção. | Distinguir relato inicial, estimativa e diagnóstico. Não atribuir defeito a uma peça apenas pela seleção do sintoma. |
| [iSmash — seleção de serviço](https://www.ismash.com/pages/select-a-service) e [consulta de reparo](https://www.ismash.com/pages/device-repair-enquiry) | Entradas por categoria e um formulário separado para aparelho/reparo fora das opções padrão. | “Outro modelo” e “Outro problema” devem continuar no mesmo fluxo da Master Prime, evitando uma nova jornada longa. |
| [Conserta Smart](https://www.consertasmart.com/) | Entrada de orçamento pelo WhatsApp com tipo de aparelho, modelo, defeito e dados de contato/localização. | Referência brasileira para a passagem ao atendimento. Como a Master Prime já tem destino definido, telefone e CEP podem ficar para a conversa quando necessários. |
| [GP Controllers — reparos de controles](https://gpcontrollers.co.uk/pro-controller-repairs) | Plataforma filtra marca/modelo; aceita vários sintomas, inclui “não sei” e apresenta resumo do pedido. | Referência específica para controles: diferenciar analógicos, botões, gatilhos e conexão; confirmar compatibilidade antes de sugerir um módulo. É um especialista de nicho, sem evidência aqui de liderança de mercado. |

**Síntese de projeto:** combinar a seleção progressiva da Samsung, a prudência da Apple, a flexibilidade da iSmash e a passagem ao WhatsApp da Conserta Smart. Para controles, aproveitar os campos direcionados da GP Controllers. Esta é uma recomendação de UX baseada nos padrões observados, não um resultado de teste de conversão.

Não importar de concorrentes preços, prazos, garantia, diagnóstico gratuito, certificações, marcas autorizadas, peças ou promessas de resultado.

## Fluxo proposto

Quatro etapas visíveis. Cada etapa apresenta apenas as opções relevantes às escolhas anteriores.

1. **Aparelho:** quatro cartões — Celular, Notebook, Videogame, Controle.
2. **Marca e modelo:** marca filtrada por categoria, modelo pesquisável, “Outra marca”, “Não encontrei meu modelo” e “Não sei o modelo”. Modelo livre quando necessário. Plataforma pode ajudar na identificação de controles, sem acrescentar uma etapa obrigatória.
3. **O que está acontecendo?:** opções de sintomas específicas da categoria, seleção múltipla e “Outro problema”. Texto opcional para contextualizar; se escolher “Outro problema”, pedir uma descrição curta ou permitir continuar para explicar no WhatsApp.
4. **Revisar e continuar:** resumo editável de aparelho, marca, modelo e sintomas, seguido de “Continuar no WhatsApp”. Explicar antes do clique: “O WhatsApp abrirá com seu resumo. Toque em Enviar para iniciar o atendimento.”

“Não sei identificar” deve permitir avançar. Não transformar incerteza do solicitante em bloqueio. Uma descrição livre ou uma conversa pode substituir informação desconhecida.

### Sintomas iniciais sugeridos

Proposta baseada nos serviços e conteúdos existentes em `src/utils/constants.ts` e `src/data/seo-pages.json`. Não é ranking de frequência dos atendimentos da empresa. A equipe deve revisar os rótulos antes de publicar.

| Categoria | Opções propostas |
| --- | --- |
| Celular | Tela quebrada ou sem imagem; bateria descarrega rápido; não carrega; não liga; contato com líquido; problema no sistema; outro problema. |
| Notebook | Não liga; liga sem imagem; tela danificada; teclado falhando; dobradiça/carcaça danificada; aquece ou desliga; lentidão; outro problema. |
| Videogame | Não liga; liga e desliga; sem imagem; aquece ou faz ruído; outro problema. |
| Controle | Analógico move sozinho/drift; botão ou gatilho falhando; não conecta ou desconecta; não liga ou não carrega; outro problema. |

Para drift, perguntar opcionalmente “Esquerdo, direito ou ambos?”. Para notebook sem imagem, distinguir “não liga” de “liga, mas a tela fica preta”. Usar linguagem de sintomas e histórico simples; não exigir testes técnicos do cliente.

Separar pedidos de melhoria, como SSD/RAM ou consulta sobre Hall Effect, dos sintomas. Uma solicitação não deve confirmar que a melhoria é compatível ou necessária.

### Catálogo de marcas e modelos

Começar com um catálogo pequeno validado pela empresa e ampliá-lo com os modelos efetivamente recebidos. Não há no repositório uma lista completa e aprovada de marcas/modelos para as quatro categorias. Há conteúdo específico de PS4/PS5, mas isso não comprova um catálogo inteiro de consoles ou controles.

Manter IDs estáveis e dados separados da interface: categoria, marca, modelo, aliases de busca, sintomas e disponibilidade de consulta confirmada. Buscar sem diferenciar maiúsculas/acentos e permitir nome/código digitado. Para notebooks, nome comercial e código podem ser mais úteis que uma lista extensa.

O texto do fluxo deve deixar claro que informar o modelo permite consultar o atendimento. A presença no seletor não comprova disponibilidade de peça, autorização da marca ou viabilidade do reparo.

## Aparência e uso no celular

Reaproveitar os tokens reais de `tailwind.config.js`: fundo `#0A0A0A`, cartões `#151515`, dourado `#FFD700`, tipografia Britanica e verde WhatsApp `#25D366` quando útil no CTA final.

- Uma coluna no celular; cartões de categoria em grade 2 × 2 se houver espaço. No desktop, formulário com resumo lateral.
- Título direto e progresso “Etapa 2 de 4”; botões Voltar/Continuar previsíveis e resumo com ações de editar.
- Ações com altura mínima proposta de 48 px, campos com fonte de pelo menos 16 px e foco de teclado visível.
- Rótulos persistentes, estado selecionado indicado por texto/ícone além da cor, erros próximos do campo e anúncio de mudança de etapa para leitores de tela.
- Transições discretas de cerca de 150–200 ms, respeitando redução de movimento. Evitar animação contínua na área do formulário.
- Barra inferior de ação com espaço reservado; conferir teclado virtual e área segura para não cobrir campos.
- Preservar respostas ao voltar; ao mudar categoria/marca, limpar escolhas dependentes incompatíveis e informar o usuário.
- Atalho visível “Prefiro falar com a equipe” em todas as etapas. Se JavaScript estiver indisponível, manter explicação e link de contato no HTML.

Esses são critérios propostos de implementação; nenhum protótipo mobile foi construído ou validado nesta etapa.

## Como deve funcionar o WhatsApp

### Primeira versão recomendada: resumo + atendimento humano

O número atual no código é `5521967635340`. Reutilizar a configuração comercial existente. A [documentação oficial de click to chat](https://faq.whatsapp.com/5913398998672934) permite abrir uma conversa no celular ou WhatsApp Web com mensagem preenchida. O link prepara a mensagem no campo de texto; o solicitante conclui o envio no WhatsApp.

Exemplo ilustrativo de conteúdo, sem afirmar cobertura desse modelo pela Master Prime:

```text
Olá! Vim da área de orçamento do site Master Prime.

Aparelho: Controle
Marca/modelo informado: [modelo selecionado ou digitado]
Sintomas: Drift no analógico esquerdo; botão falhando
Detalhes: [observação opcional]

Gostaria de consultar a possibilidade de atendimento e orçamento.
```

Não exigir identificação adicional do cliente antes de abrir a conversa. A equipe poderá pedir as informações necessárias ao atendimento no próprio WhatsApp.

Após abrir o WhatsApp, o site deve continuar exibindo o resumo e oferecer “Abrir novamente” e “Copiar resumo”. Não mostrar “Pedido enviado”, criar uma ordem de serviço fictícia ou prometer resposta em prazo não confirmado. Um código local não equivale a protocolo de atendimento sem registro no servidor.

Fotos e vídeos podem ser enviados na conversa. Isso evita um upload no site na primeira versão. Não pedir senha, CPF, IMEI, número de série, endereço completo ou cadastro para iniciar essa consulta. Texto livre deve ser curto e orientar a não inserir dados sensíveis.

### Organização do atendimento: proposta operacional

Definir um responsável pela fila e uma rotina para acompanhar cada conversa. Sugestão de estágios manuais: novo pedido → aguardando informações → avaliação/orçamento → aguardando decisão → concluído. Confirmar quais ferramentas de organização estão disponíveis na conta WhatsApp usada pela empresa antes de configurar.

A primeira resposta deve confirmar o resumo e solicitar apenas a informação que falta. Depois, a equipe confirma possibilidade de atendimento, necessidade de avaliação e condições aplicáveis. Disponibilidade de retirada/entrega continua sujeita à confirmação para o endereço.

Um link para WhatsApp não permite recuperar quem abriu a conversa e saiu sem enviar. Se acompanhamento de abandono ou integração com CRM for necessário, planejar uma segunda etapa com contato informado, registro persistente e integração oficial. Essa necessidade muda o escopo; não é resolvida apenas com o formulário.

### Medição

Medir início, etapa concluída, resumo revisado e clique para WhatsApp como eventos distintos. O clique não comprova mensagem recebida, orçamento aprovado ou venda. Vincular resultados reais ao atendimento somente quando houver mecanismo confiável de confirmação.

O código atual em `src/utils/whatsapp.ts` envia a URL completa do WhatsApp ao `dataLayer` e chama `trackLeadEvent()` no clique. Ao integrar texto livre do formulário, ajustar o rastreamento para não registrar a mensagem/URL completa, nome, telefone ou detalhes livres em analytics. Manter apenas eventos e categorias permitidas; distinguir o novo funil sem alterar campanhas existentes automaticamente.

## Integração com o site e SEO

O projeto usa React 18 + TypeScript + Vite com pré-renderização. Já possui serviços das quatro categorias e utilitários WhatsApp. Não foi localizado um fluxo próprio de orçamento. Há uma alteração pré-existente em `src/components/sections/Location.tsx`; preservar esse trabalho.

Arquitetura proposta: `/orcamento`, com a intenção distinta de organizar uma solicitação de reparo e continuar no WhatsApp. A página será pública e voltada a clientes finais.

Para uma página pública indexável, pré-renderizar introdução, instruções, quatro categorias, contexto de avaliação e contato. Usar H1, title, description, canonical e breadcrumb próprios; incluir link natural na navegação e nas páginas de serviço. Título candidato para clientes: “Solicitar orçamento de reparo | Master Prime”. A proposta não representa pesquisa de volume ou ranking.

Etapas e combinações de marca/modelo/sintoma não precisam virar URLs indexáveis. Preservar todas as URLs atuais; não criar páginas por bairro ou por cada combinação de formulário. Adicionar a nova URL ao sitemap somente após responder 200, com canonical correto e conteúdo adequado à indexação.

Preservar robots, bloqueio de `/api/`, acesso de Googlebot/OAI-SearchBot e política atual de GPTBot. Reutilizar `https://master-prime.com/#localbusiness`; relacionar um `Service` apenas quando descrever um serviço verificável e usar breadcrumb coerente. Não criar `Offer`, preço, avaliações próprias ou `AggregateRating` para o formulário.

Manter o NAP: Master Prime Assistência, Avenida Cesário de Melo, 2571, Campo Grande, Rio de Janeiro/RJ. Não acrescentar impressoras. Ícones podem orientar as categorias; imagens como prova de experiência devem ser reais da empresa.

## Decisões que antecedem a implementação

1. Público definido: clientes finais.
2. Validar catálogo inicial de marcas/modelos e rótulos de sintomas com a empresa; desconhecidos continuam aceitos como consulta.
3. Definir responsável e rotina do atendimento, usando o número atual até orientação diferente.
4. Manter solicitação sem preço automático enquanto não houver tabela comercial validada.

Escopo inicial proposto: uma página, quatro categorias, escolhas dependentes, campos livres de exceção, revisão editável e passagem ao WhatsApp. Registro persistente de pedidos, painel e CRM são extensões a considerar conforme a operação.

## Validação e limites

A pesquisa não usou Search Console, Analytics, dados de abandono, CrUX, backlinks ou registros internos de reparo. Portanto, não há base para estimar volume de busca, ganhos de conversão, frequência de defeitos, custos ou prazo de desenvolvimento.

Antes de entregar a implementação futura: conferir os quatro caminhos no celular e desktop, teclado/leitor de tela, modelos desconhecidos, vários sintomas, edição de etapas, mensagem com acentos e quebras de linha, abertura e retorno do WhatsApp e ausência de dados livres no tracking. Executar lint, typecheck, build e testes, com auditoria de links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e referências a impressoras.

Verificações executadas nesta etapa de descoberta, sobre o site existente:

- `npm run lint`: aprovado.
- `npm run build`: aprovado, incluindo `typecheck`, cliente, SSR e pré-renderização de 31 páginas React.
- `npm test`: aprovado; auditoria de 32 páginas indexáveis e 29 intenções de serviço, metadata única, H1, canonical, JSON-LD, sitemap, robots, redirects, links internos, páginas órfãs, NAP e referências a impressoras.
- Verificação HTTP do site publicado: `/` e `/servicos` responderam 200; `/__orcamento_discovery_nonexistent__` respondeu 404.
- O build informou base Browserslist desatualizada; isso não impediu a conclusão. Nenhuma dependência foi alterada nesta descoberta.
- Nenhum código público foi modificado por esta tarefa. Arquivo criado: `docs/orcamento-discovery.md`. A alteração pré-existente em `Location.tsx` foi preservada e o sitemap não apresentou diferença após o build.

Essas verificações não comprovam um formulário ainda não implementado. O resultado desta etapa é a pesquisa e a proposta, sem nova página publicada ou mudanças em schema/robots/sitemap.
