# Regras permanentes — Master Prime Assistência

## Verdade comercial

- Não inventar serviços, preços, prazos, garantias, certificações, marcas autorizadas, peças, equipe ou resultados.
- Confirmar afirmações comerciais no repositório atual ou em fonte primária fornecida pela empresa.
- Impressoras estão fora do escopo atual. Não publicá-las como serviço nem incluí-las em dados estruturados.
- Manter o NAP comercial: Master Prime Assistência, Avenida Cesário de Melo, 2571, Campo Grande, Rio de Janeiro/RJ. Não alterar telefone, e-mail ou horários sem confirmação.
- Não usar `lp.master-prime.com` como fonte de verdade comercial.

## Conteúdo e arquitetura

- Preservar URLs indexáveis existentes e investigar tráfego, backlinks e dependências antes de remover ou redirecionar.
- Criar uma URL apenas quando houver intenção distinta e conteúdo próprio; evitar doorway pages, páginas por bairro e variações quase idênticas.
- Escrever conteúdo people-first, concreto e tecnicamente prudente. Explicar sintomas, hipóteses, diagnóstico e critérios de decisão sem prometer o resultado antes da avaliação.
- Evitar keyword stuffing, texto oculto e blocos artificiais de links.
- Manter cada página indexável acessível por links internos naturais, com H1, title, description, canonical e breadcrumb próprios.
- Usar somente imagens reais da empresa como prova de experiência. Manter slots preparados no código quando os arquivos ainda não existirem.
- Os WebP em `src/assets/images/iphone/` são imagens de produto; as originais Apple fornecidas pelo usuário estão em `apple-17-pro-max/`, com proveniência em `sources.json`. Não são fotos de unidades reais da loja. Substituí-los por fotos reais quando fornecidas, mantendo o mapeamento por modelo e `colorId` em `src/data/iphone-product-images.ts`.
- Os arquivos em `apple-18-pro-max/` foram preparados dos originais fornecidos em `/home/wayne/Downloads/18_pro_max`, com proveniência em `sources.json`. O modelo 3D usa a geometria Pro do pacote fornecido, com estados Preto, Bordô (internamente `Plum`) e Prateado; não representa uma unidade real da loja.

- As referências de seminovos em `src/assets/images/iphone/apple-used/` vêm do pacote fornecido em `/home/wayne/Downloads/iphone_promotional_images`, com proveniência e hashes em `sources.json`. São renders por modelo e cor, não fotos de unidades da loja. As cores marcadas são preferências múltiplas; a equipe confirma disponibilidade e condição no WhatsApp. Não adicionar 3D aos seminovos.

## SEO técnico

- Gerar HTML rastreável para o conteúdo principal; não depender apenas de renderização client-side.
- Incluir no sitemap apenas URLs 200, indexáveis, canônicas e não redirecionadas.
- Preservar bloqueios legítimos de `robots.txt`; permitir Googlebot e OAI-SearchBot nas páginas públicas sem alterar automaticamente a política de GPTBot.
- Usar dados estruturados apenas quando semanticamente corretos e verificáveis. Não publicar `AggregateRating` ou `Review` da própria empresa para buscar estrelas orgânicas.
- Manter uma entidade `LocalBusiness` estável e relacionar páginas específicas por `Service.provider` e `BreadcrumbList`.
- Antes de entregar, executar lint, typecheck, testes, build, auditoria de links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP e referências a impressoras.
