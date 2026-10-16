# Homepage quote entry

The homepage now starts a guided quote before the WhatsApp handoff. General quote CTAs link to `/#orcamento`; service cards link directly to their existing forms. The selector offers celular, notebook, computador, PC gamer maintenance, videogame, controle, and a separate PC assembly entry.

The existing black and gold design stays in place. Gold identifies internal quote actions; device names and short descriptions distinguish the paths. No new imagery or commercial promises were added. Copy explains that values and conditions are confirmed by the team and repairs require technical evaluation. The first two “Como funciona” steps now describe the website form and review before WhatsApp. The navigation/footer quick links include Orçamento; explicit contact links remain available.

Interaction feedback uses short border/background transitions, an arrow shift on hover or keyboard focus, and a press scale. Existing hero/button animations remain. Reduced motion uses the existing global rule. No additional scroll effects were added to this local workflow change. Self-reviewed on desktop and mobile; no independent review. Replaced the repeated “Solicitar Atendimento” labels with “Solicitar orçamento” to make the destination clear.

Validation completed:

- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, and `git diff --check` passed.
- The existing SEO audit passed for 37 indexable URLs: metadata, one H1 per page, canonical URLs, internal links, sitemap, robots, JSON-LD, NAP and printer exclusions. Existing routes and metadata were preserved.
- Chromium checks against the production preview passed at 320, 390, 768 and 1440 pixels: hero anchor, seven selector destinations, six service quote links, selector overflow, keyboard access and visible focus. No page exceptions were observed.
- Each selector entry was clicked through to its form in the same tab. PC gamer, videogame and controle presets were checked; both gaming presets continued to platform selection. No entry opened WhatsApp or emitted a WhatsApp conversion event.
- With JavaScript disabled, the prerendered selector links still navigate and the quote page provides its existing noscript contact fallback.

Evidence: `browser-results.json`, `before-desktop.png`, `hero-390.png`, `hero-1440.png`, and `selector-full-390.png` / `selector-full-1440.png`. The screenshot helper requires Node 22; this environment uses Node 20, so screenshots and interaction checks used the existing Playwright installation and local Chrome. Screenshots were visually inspected. Build completed with an existing Browserslist age notice.
