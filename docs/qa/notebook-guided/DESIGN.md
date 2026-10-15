# Notebook quote: guided mobile flow

North star: one clear question, one deliberate next step, in Master Prime's black and gold.

Existing service quote form for consumers on mobile browsers (iOS Safari and Android Chrome), with responsive tablet and desktop layouts. React 18, TypeScript, Vite, existing Britanica fonts and Framer Motion. Browser navigation remains standard; visible Back/Continue controls navigate questions within the existing URL. No additional service claims, images, paid services, or new routes.

The original page had five stages but exposed brand and model together, repeated explanatory copy, all conditional questions together, and a decorative desktop column. Keep the five meaningful groups in the progress indicator while revealing one question at a time. Explicit Continue preserves multiple selection and lets people check their choice; auto-advance would make corrections and keyboard use harder.

## Mobile checkpoint

Platform: responsive website, both iOS and Android; no native app or framework migration.
Framework: existing React / TypeScript.
Read: mobile-design-thinking, touch-psychology, mobile-performance, mobile-backend, mobile-testing, mobile-debugging, platform-ios, platform-android; frontend-design; oil-ui and its visual-language, media, motion, tools and visual-review references.
MFRI: clarity 5 + accessibility readiness 5 − interaction complexity 2 − performance risk 2 − offline dependence 1 = 5 (moderate; validate UX and responsive behavior).

Principles: minimum 48 px controls; primary action at the bottom on mobile with safe-area and keyboard accommodation; preserve answers through back navigation and interruptions. Avoid gesture-only actions and scrolling to a second question after selection. Catalog failure allows manual model entry; the WhatsApp handoff needs connectivity. No offline app shell is added.

Native guidance is applied to browser constraints: 16 px text inputs prevent unwanted iOS focus zoom and safe-area padding accommodates the home indicator. A visualViewport observer detects typing without scrolling or repositioning the action bar. No interception of platform back gestures. No global state library, native picker, list virtualization, or additional animation dependency is needed for these short option groups. Catalog downloads remain per brand.

## Design and behavior

Centered, open composition; retain existing logo, Britanica, #0a0a0a background and #ffd700 accent. Green is reserved for WhatsApp. Selection uses both a checkmark and a border. No decorative image is needed because the task is choosing an answer.

Sequence: brand → model → symptoms / requests → one conditional optional question at a time → optional notes → attendance preference → neighborhood → city (these two only for pickup) → review. Other/unknown brands, unknown models, free-text entry and model suggestions remain available. Review edits return directly after their group. Skipping details preserves answers and notes. Changing symptoms discards obsolete answers; changing pickup to store omits location from the message.

Reduced copy: remove the introductory pitch, repeated brand/model instructions, descriptions under every symptom, scrolling guidance notes and redundant WhatsApp instructions. The how-it-works explanation is an expandable section after the form. Retain field labels, useful model help, Icecat attribution, pickup conditions and the evaluation caveat. Brand availability remains a question for the team, never a promise of authorized repairs.

Latest user steering overrides the initial motion plan: automatic scrolling, entrance animations and sliding question transitions are removed. Focus announcements use preventScroll. Only direct press/selection feedback remains. The browser handles native keyboard panning; no code calls scrollTo, scrollBy or scrollIntoView.

Keyboard-open mode uses a 22 px heading, omits the repeated subtitle, keeps 16 px input text and limits suggestion height. The bottom actions are hidden while typing rather than lifted above the keyboard; the native Done key remains available and the action bar returns when typing ends. Inputs use a single restrained neutral focus border, with no extra outline or yellow glow. Catalog attribution returns when the keyboard is dismissed. Pinch zoom is not treated as a keyboard.

Draft: same two-hour sessionStorage format/key, with question identifier and review-edit context added; legacy five-stage drafts are accepted. Saving immediately after changes removes the former debounce window before refresh. Storage denial does not prevent filling or sending.

## Evidence and acceptance

Before/after screenshots and representative states are in this directory. Browser validation covers 320, 390, 430, 768 and 1440 px; full flow, errors, backward navigation, optional questions, pickup, review editing, refresh, denied storage, failed catalog, WhatsApp interception and manual copy fallback. Axe checks target the quote header and main form. Separate checks cover 200% text scaling, a small landscape viewport, compressed catalog suggestions and pre-rendered HTML without JavaScript.

No deployment or real WhatsApp message is part of this change. Headless browser checks cannot reproduce a real iOS/Android software keyboard, VoiceOver/TalkBack or device performance; those remain real-device checks.

## Independent visual review and final validation

One independent existing-interface visual review (no numeric score). Its findings were the Samsung label splitting at 320 px and the optional “Sem cadastro” text competing with Continue. Narrow-brand padding was reduced and the extra message removed. Preserved the centered question, open composition, gold progress, deliberate Continue action and green WhatsApp action. The review did not verify a real software keyboard; the user then supplied a real iPhone screenshot and requested removal of automatic movements.

Oil screenshot lint flags the clipped screen-reader-only progress label over a yellow progress segment as low contrast. It is not a visible label; visible text and controls pass Axe. Scroll storytelling and motion are deliberately absent in this functional form, matching the user's latest instruction.

`browser-results.json` records the five-width complete flow; `browser-repeat.json` records repeat validation. `keyboard-results.json` records a simulated keyboard, pinch zoom, landscape, 200% zoom and instrumentation verifying zero programmatic scroll calls. Keyboard geometry in the screenshot is simulated, not a real keyboard capture. Build, lint, typecheck, eleven rule/catalog tests and the 33-page SEO audit pass. The SEO audit covers internal links, metadata, H1, canonical, sitemap, robots, JSON-LD, NAP and printer references.
