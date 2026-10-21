# iPhone catalog hub

North star: **compare the store's catalog and prices, choose a model, and consult the team without implying confirmed inventory.**

The audience is a customer opening a link sent by an attendant, usually on a phone. This extends the existing site and quote flow, so oil-ui's existing-product feature path applies: preserve the current black/gold identity, Britanica typography, familiar controls and commercial data rather than explore three replacement styles. Apple's accessibility, layout, typography, collection and motion principles apply to this React website; native iOS navigation conventions do not.

## Presentation and scope

- `/orcamento/iphone` is now the catalog home. Links with `model`, `capacity` and `condition` preserve the existing configurator contract; `?view=quote` explicitly opens the generic configurator. The template sanitizer accepts only that exact `view` value. Canonical URL and sitemap entry remain unchanged.
- Fourteen model/condition groups come from the existing 22 commercial variants: two sealed models and twelve used models. Multiple capacities and colors are grouped. Starting cash and installment amounts come from the same cheapest consultable variant; unavailable variants are excluded from the group, starting price and entry link. No prices, products or inventory states are added.
- Sealed products use the supplied product images and per-model mapping. Used models pair their comparable prices with supplied reference renders, mapped by model and color; these do not represent individual store units. The signature is an image-led sealed collection followed by a compact used collection.
- Filters show all, sealed or used models. The copy action shares only the production canonical catalog link; success has visible feedback, and clipboard failure exposes a selectable link. It does not send any message.
- Choosing a model opens its existing quote flow, retaining validated attribution. Browser back/forward, reload and existing draft restoration work. The configurator header links back to all iPhones. The catalog itself does not emit quote funnel milestones.
- All catalog names, capacities, prices, links and the business location are prerendered. Without JavaScript the catalog remains readable and provides a direct WhatsApp alternative. Metadata and breadcrumb reflect the hub; JSON-LD retains the stable LocalBusiness/WebPage/BreadcrumbList without Offer, ratings or inventory promises.
- The catalog states that availability and conditions are confirmed by the team. The dated table is not live inventory; an inventory management interface is outside this change.

## Visual system and accessibility

Existing colors: canvas `#0a0a0a`, product surface `#151515`, primary text `#f5f5f7`, secondary text `#a5a5ad`, accent `#ffd700`, control surface `#191919`. These continue the site's dark appearance without introducing a separate theme switch. Contrast ratios calculated from these actual hex values:

- Secondary on canvas: 8.09:1; secondary on product surface: 7.47:1.
- Primary text on product surface: 16.77:1.
- Dark text on gold: 14.12:1; unselected filter text `#bdbdc4` on control surface: 9.41:1.

Britanica carries identity in headings and copy; the existing configurator's system font stack carries prices to avoid Britanica's decorative numeric alternates. Body text is 16–18px, supporting text 13–15px, model headings 20–24px and the fluid display heading 40–76px. Controls have at least 48px height, supporting navigation at least 44px, visible keyboard focus and accessible names. Filters use visible selection plus `aria-pressed`, and result counts and copy feedback are announced. At 200% text filters wrap into additional rows and cards reflow without clipping their controls.

Compact: header → title/instruction → filters/date/availability → sealed product cards → used price rows → location/footer. Regular: same order, two sealed cards and three used columns. The imagery never substitutes one model for another. No blur, transparency effects or unnecessary status badges are introduced.

Apple reference basis (read from the invoked apple-design skill): `collections.md › Best practices` recommends standard rows/grids; `typography.md › Supporting Dynamic Type` addresses reflow and hierarchy; `accessibility.md` covers readable content and accessible controls; `motion.md › Best practices` requires purposeful, optional motion. This is an application of those principles, not a claim of native HIG conformance.

## Motion and restraint

The introduction settles over 450ms, the selected filter indicator moves over 200ms, actions have immediate press feedback, and product imagery lifts by 3px on hover. Reduced motion removes transforms and transitions. Filtering updates actual content immediately. This is a browsing utility, so it has no decorative scroll narrative.

The subtraction pass removed “Compare os modelos. Encontre o seu.” and replaced the introduction with one concrete instruction. The review also led to tighter used rows, an inline cash-payment qualifier, and grouping the table date with availability context. No added marketing claims, feature badges or extra explanatory panels.

## Independent review and evidence

One isolated visual review inspected mobile, desktop, full-page, clipboard-failure and 200%-text screenshots. Initial score: **7/10**. Findings were a clipped enlarged-text filter and slow comparison across tall used entries; recommendations included closer date/availability context and less introductory copy. All were addressed, then visually rechecked by the primary agent. The initial score has not been presented as a score of the revised page. The reviewer could not assess motion from screenshots.

Evidence uses local Playwright with external requests blocked, because oil-ui's screenshot utility requires Node 22 while this environment uses Node 20. Files are in `.cache/iphone-hub/`:

- `hub-320.png`, `hub-390.png`, `hub-768.png`, `hub-1440.png`, full-page mobile/desktop captures, `hub-text-200.png`, `hub-used.png` and `hub-copy-fallback.png`.
- `browser-report.json`: flow, responsive, keyboard, copy/failure and restoration checks. Assertions include actual filter bounding boxes and internal clipping at enlarged text, not only document overflow.
- `video/`, `motion-*-start.png`, `motion-*-end.png`, `motion-copy.png`, `motion-used.png`, `motion-report.json`: normal-motion filter/feedback recording and observable transition checks. These are evidence files, not an independent motion review or performance benchmark.
- `build.log`, `test.log`: project build and full test/SEO results.

Validation commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:iphone-catalog-browser` against the built local preview (with the environment's existing Playwright module and Chrome executable). The SEO validator covers links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP and printer exclusions. Catalog browser QA is repeated three times for asynchronous entry/clipboard behavior. Existing browsers-data and optional model-viewer chunk-size build warnings are unrelated to the hub. No deployment, campaign change or real WhatsApp send is performed.
