---
name: master-prime-local-seo
description: Auditar e expandir SEO Local, SEO técnico, conteúdo por intenção e GEO/AEO no repositório da Master Prime Assistência. Usar ao criar, revisar ou validar páginas, metadata, structured data, links internos, robots, sitemap e sinais de entidade da Master Prime.
---

# Master Prime Local SEO

Executar o workflow na ordem abaixo. Tratar o repositório e fontes primárias atuais como verdade; nunca usar `lp.master-prime.com` como fonte comercial.

## Guardrails comerciais

- Manter a entidade `Master Prime Assistência` e o endereço comercial `Avenida Cesário de Melo, 2571, Campo Grande, Rio de Janeiro/RJ`.
- Confirmar telefone, e-mail, horários, áreas atendidas e cada serviço antes de publicar.
- Excluir impressoras de listas e schema atuais. Não remover uma URL histórica de impressora sem antes avaliar tráfego, backlinks e um redirect controlado.
- Não inventar preço, prazo, garantia, certificação, autorização de marca, peça, equipe, volume ou resultado.
- Não criar páginas por bairro, doorway pages, texto oculto, stuffing ou variações quase idênticas.

## 1. Auditar antes de editar

1. Ler `AGENTS.md` e verificar o estado do Git.
2. Identificar framework, renderização, rotas, componentes, navegação, metadata, canonicals, robots, sitemap, redirects, JSON-LD, links, NAP e serviços publicados.
3. Testar status HTTP de URLs existentes e uma URL inexistente.
4. Registrar evidências e distinguir limitações de repositório de dados indisponíveis em Search Console, Analytics, GBP, CrUX ou backlinks.
5. Não executar remoções destrutivas durante a auditoria.

## 2. Pesquisar e mapear intenção

1. Pesquisar termos em PT-BR e resultados locais atuais quando houver acesso à web ou ferramentas SEO.
2. Mapear keyword principal, variações semânticas, intenção, serviço confirmado e URL canônica.
3. Não inventar volume, CPC ou dificuldade.
4. Consolidar termos com a mesma necessidade; separar somente quando sintomas, decisão e conteúdo justificarem documento próprio.
5. Priorizar clusters de notebook, computador, celular, PC gamer, videogame e controles apenas na extensão comprovada pelo negócio.

## 3. Criar ou revisar páginas

- Produzir conteúdo original que explique sintomas, causas possíveis, diagnóstico, serviço, limites e quando reparar ou substituir.
- Usar uma resposta direta perto do início e perguntas reais em headings quando forem úteis para AEO.
- Incluir H1 único, title e description próprios, canonical autocanônico, breadcrumb, CTA contextual e links para hub e páginas relacionadas.
- Manter linguagem prudente: sintomas orientam o diagnóstico, mas não comprovam uma peça defeituosa.
- Preparar slots de imagem no modelo, mas renderizar somente arquivos reais fornecidos pela empresa, com dimensões e alt text descritivo.

## 4. Entidade e dados estruturados

- Reutilizar `https://master-prime.com/#localbusiness` como `@id` da entidade principal.
- Publicar somente propriedades visíveis ou verificadas de `LocalBusiness`.
- Relacionar páginas específicas com `Service.provider` e adicionar `BreadcrumbList` coerente com os links visíveis.
- Não adicionar `AggregateRating`, `Review` ou FAQ schema apenas para tentar obter rich results.
- Validar todo JSON-LD como JSON e conferir URLs, tipos e referências de entidade.

## 5. Crawlability e descoberta

- Entregar conteúdo principal no HTML gerado, preferindo SSR/SSG/pré-renderização compatível com a arquitetura existente.
- Incluir no sitemap somente páginas indexáveis, 200 e canônicas.
- Manter `robots.txt` com sitemap absoluto, bloqueios legítimos e acesso público para Googlebot e OAI-SearchBot. Não alterar GPTBot sem instrução explícita.
- Implementar redirects permanentes específicos para rotas obsoletas confirmadas; evitar catch-all que gere soft 404.

## 6. Validar antes de entregar

Executar os comandos do projeto para lint, typecheck, testes e build. Além disso, validar programaticamente:

- uma H1, title, description e canonical por página;
- ausência de metadata duplicada e páginas órfãs;
- links internos e destinos no build;
- correspondência sitemap ↔ páginas geradas;
- robots, redirects e status de URL desconhecida;
- parse de JSON-LD e consistência do NAP;
- ausência de impressora como serviço atual;
- renderização mobile e imagens reais quando disponíveis.

Entregar relatório com estado anterior, mapa de intenção, URLs, mudanças técnicas, schema/robots/sitemap, pendências comerciais, riscos de QA, comandos executados e arquivos modificados. Não prometer posições no ranking.
