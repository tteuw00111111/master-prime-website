import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiCheck, FiChevronDown, FiCode, FiGrid, FiHelpCircle, FiMapPin, FiPlus, FiSearch, FiTruck, FiX } from 'react-icons/fi'
import { LuGamepad2 } from 'react-icons/lu'
import { SiAdobephotoshop, SiAdobepremierepro, SiAutocad, SiBlender, SiDavinciresolve } from 'react-icons/si'
import type { IconType } from 'react-icons'
import { PC_GAMES, PC_PROGRAMS, PC_PURPOSES } from '@/data/pc-build-quote'
import artwork from '@/data/pc-game-artwork.json'
import type { PcBuildQuoteDraft, PcFeasibilityNotice } from '@/types/pc-build-quote'
import { addPcCustomSelection, formatPcBudget, getPcSelections, normalizePcSearch, pcLabel, searchPcCatalog, togglePcSelection, updatePcBuildQuote } from '@/utils/pc-build-quote'
import { QuoteReveal } from './QuoteUI'

const covers = artwork.images as Record<string, { image: string; source: string; provider: string }>
const programIcons: Record<string, IconType> = { photoshop: SiAdobephotoshop, premiere: SiAdobepremierepro, resolve: SiDavinciresolve, blender: SiBlender, autocad: SiAutocad, vscode: FiCode, office: FiGrid }

export const PcBuildChoices = ({ items, value, onSelect, multiple = false, limit }: { items: readonly { id: string; name: string; hint?: string }[]; value: string | string[]; onSelect: (id: string) => void; multiple?: boolean; limit?: number }) => <div className="quote-answers pcb-choices">{items.map(item => {
  const selected = Array.isArray(value) ? value.includes(item.id) : value === item.id
  return <button key={item.id} type="button" className={`quote-answer ${selected ? 'selected' : ''}`} aria-pressed={selected} disabled={multiple && !selected && !!limit && Array.isArray(value) && value.length >= limit} onClick={() => onSelect(item.id)}><span><strong>{item.name}</strong>{item.hint && <small>{item.hint}</small>}</span><span className={`quote-radio-mark ${multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{selected && <FiCheck />}</span></button>
})}</div>

export const PcBuildSwatches = ({ field, items, value, onSelect }: { field: 'caseColor' | 'lighting'; items: readonly { id: string; name: string }[]; value: string; onSelect: (id: string) => void }) => (
  <div className={`pcb-swatches pcb-swatches-${field === 'caseColor' ? 'color' : 'light'}`}>{items.map(item => {
    const selected = value === item.id
    return <button key={item.id} type="button" className={`pcb-swatch ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(item.id)}>
      <span className={`pcb-swatch-dot pcb-swatch-${field === 'caseColor' ? 'color' : 'light'}-${item.id}`} aria-hidden="true" />
      <span className="pcb-swatch-label">{item.name}</span>
      <span className="pcb-swatch-check" aria-hidden="true"><FiCheck /></span>
    </button>
  })}</div>
)

export const PcBuildCatalogPicker = ({ kind, draft, onChange, error, reducedMotion }: { kind: 'games' | 'programs'; draft: PcBuildQuoteDraft; onChange: (value: PcBuildQuoteDraft) => void; error?: string; reducedMotion: boolean }) => {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [showSelections, setShowSelections] = useState(false)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const isGames = kind === 'games'
  const catalog = isGames ? PC_GAMES : PC_PROGRAMS
  const selectedIds = draft[isGames ? 'gameIds' : 'programIds']
  const customs = draft[isGames ? 'customGames' : 'customPrograms']
  const unknown = draft[isGames ? 'gamesUndecided' : 'programsUndecided']
  const count = selectedIds.length + customs.length
  const matches = searchPcCatalog(catalog, query)
  const trimmed = query.trim()
  const alreadyAdded = [...getPcSelections(draft, kind), ...catalog.filter(item => selectedIds.includes(item.id)).flatMap(item => item.aliases ?? [])].some(name => normalizePcSearch(name) === normalizePcSearch(trimmed))
  const add = () => {
    if (!normalizePcSearch(trimmed) || count >= 10 || alreadyAdded) return
    onChange(addPcCustomSelection(draft, kind, trimmed))
    setQuery('')
    setStatus(`${trimmed} adicionado.`)
  }
  return <div className="quote-step-fields">
    <fieldset id={`pcb-${kind}`} tabIndex={-1} aria-invalid={!!error} aria-describedby={error ? `pcb-${kind}-error` : undefined}>
      <legend className="sr-only">{isGames ? 'Jogos que pretende jogar' : 'Programas que pretende usar'}</legend>
      {error && <p id={`pcb-${kind}-error`} className="quote-inline-error">{error}</p>}
      <label className="quote-search-field pcb-search"><FiSearch aria-hidden="true" /><span className="sr-only">{isGames ? 'Buscar ou adicionar jogo' : 'Buscar ou adicionar programa'}</span><input value={query} maxLength={60} autoComplete="off" enterKeyHint="done" placeholder={isGames ? 'Busque ou digite outro jogo' : 'Busque ou digite outro programa'} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add() } }} /></label>
      {!!count && <><button type="button" className="pcb-selection-toggle" aria-expanded={showSelections} aria-controls={showSelections ? `pcb-${kind}-selected` : undefined} onClick={() => setShowSelections(!showSelections)}><span>Ver escolhas ({count}/10)</span><FiChevronDown className={showSelections ? 'pcb-rotated' : ''} aria-hidden="true" /></button><AnimatePresence initial={false}>{showSelections && <QuoteReveal reducedMotion={reducedMotion}><div id={`pcb-${kind}-selected`} className="pcb-selected" aria-label="Suas escolhas"><AnimatePresence initial={false}>{[...selectedIds.map(id => ({ key: id, name: pcLabel(catalog, id), custom: false })), ...customs.map(name => ({ key: name, name, custom: true }))].map(item => <motion.button key={item.key} type="button" layout={!reducedMotion} initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }} transition={{ duration: reducedMotion ? 0 : 0.15 }} aria-label={`Remover ${item.name}`} onClick={() => { onChange(item.custom ? updatePcBuildQuote(draft, { [isGames ? 'customGames' : 'customPrograms']: customs.filter(name => name !== item.name) }) : togglePcSelection(draft, kind, item.key)); setStatus(`${item.name} removido.`) }}><span>{item.name}</span><FiX aria-hidden="true" /></motion.button>)}</AnimatePresence></div></QuoteReveal>}</AnimatePresence></>}
      <div className="pcb-catalog">{matches.map(item => {
        const selected = selectedIds.includes(item.id)
        const cover = isGames ? covers[item.id] : undefined
        const Icon = isGames ? LuGamepad2 : programIcons[item.id] ?? FiGrid
        return <button key={item.id} type="button" className={`pcb-catalog-card ${selected ? 'selected' : ''}`} style={{ '--pcb-tone': item.tone } as CSSProperties} aria-pressed={selected} disabled={!selected && count >= 10} onClick={() => { onChange(togglePcSelection(draft, kind, item.id)); setStatus(`${item.name} ${selected ? 'removido' : 'selecionado'}.`) }}>
          <span className={`pcb-catalog-art ${isGames ? '' : 'pcb-program-art'}`}>{cover && !failedImages.includes(item.id) ? <img src={cover.image} alt="" width="264" height="374" loading="lazy" decoding="async" onError={() => setFailedImages(current => [...current, item.id])} /> : <Icon aria-hidden="true" />}<span className="pcb-card-check" aria-hidden="true">{selected ? <FiCheck /> : <FiPlus />}</span></span><strong>{item.name}</strong>
        </button>
      })}</div>
      {trimmed && !alreadyAdded && <button type="button" className="pcb-add-custom" disabled={count >= 10 || !normalizePcSearch(trimmed)} onClick={add}><FiPlus aria-hidden="true" /><span>Adicionar “{trimmed}”</span></button>}
      {!matches.length && !trimmed && <p className="quote-field-hint">Digite o nome para adicionar.</p>}
      <p className="quote-field-hint pcb-count" role="status">{count}/10 {isGames ? 'jogos' : 'programas'}{count === 10 ? ' · Limite atingido. Remova uma escolha para adicionar outra.' : ' · Pode escolher mais de um.'}</p>
      <label className="quote-check"><input type="checkbox" checked={unknown} onChange={event => onChange(updatePcBuildQuote(draft, { [isGames ? 'gamesUndecided' : 'programsUndecided']: event.target.checked }))} /><span>Ainda não sei</span></label>
      {isGames && <><p className="quote-small-print">Para Call of Duty, informe o título ou modo que você quer jogar.</p><p className="pcb-attribution">Capas e dados: <a href={artwork.provider === 'IGDB' ? 'https://www.igdb.com/' : 'https://www.freetogame.com/'} target="_blank" rel="noopener noreferrer">{artwork.provider}</a>.</p></>}
      <span className="sr-only" role="status">{status}</span>
    </fieldset>
  </div>
}

export const PcBuildLiveSummary = ({ draft, reducedMotion }: { draft: PcBuildQuoteDraft; reducedMotion: boolean }) => {
  const [open, setOpen] = useState(false)
  if (!draft.mode) return null
  return <aside className="pcb-live clarity-mask" data-clarity-mask="true" aria-label="Seu projeto"><button type="button" aria-expanded={open} aria-controls={open ? 'pcb-live-content' : undefined} onClick={() => setOpen(!open)}><span>Seu projeto <strong>{draft.budgetUndecided ? 'Valor a definir' : draft.budgetCents ? formatPcBudget(draft.budgetCents) : pcLabel(PC_PURPOSES, draft.purpose) || 'Em construção'}</strong></span><FiChevronDown aria-hidden="true" className={open ? 'pcb-rotated' : ''} /></button><AnimatePresence initial={false}>{open && <QuoteReveal reducedMotion={reducedMotion}><div id="pcb-live-content"><p>{pcLabel(PC_PURPOSES, draft.purpose) || 'Uso a definir'}</p>{getPcSelections(draft, 'games').length > 0 && <p>{getPcSelections(draft, 'games').join(' · ')}</p>}{getPcSelections(draft, 'programs').length > 0 && <p>{getPcSelections(draft, 'programs').join(' · ')}</p>}<p className="quote-small-print">Preferências para a equipe avaliar.</p></div></QuoteReveal>}</AnimatePresence></aside>
}

export const PcBuildDisclosure = ({ title, children, reducedMotion }: { title: string; children: ReactNode; reducedMotion: boolean }) => {
  const [open, setOpen] = useState(false)
  return <div className="pcb-learn"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)}><FiHelpCircle aria-hidden="true" /><span>{title}</span><FiChevronDown aria-hidden="true" className={open ? 'pcb-rotated' : ''} /></button><AnimatePresence initial={false}>{open && <QuoteReveal reducedMotion={reducedMotion}><div className="pcb-learn-content">{children}</div></QuoteReveal>}</AnimatePresence></div>
}

export const PcBuildCasePreview = ({ color, lighting }: { color: PcBuildQuoteDraft['caseColor']; lighting: PcBuildQuoteDraft['lighting'] }) => {
  const reducedMotion = useReducedMotion() === true
  const white = color === 'white'
  const rgb = lighting === 'rgb'
  const fan = (x: number, y: number, radius: number, speed: string) => <g transform={`translate(${x} ${y})`}>
    <circle r={radius + 3.2} fill="#0b0e12" stroke={white ? '#c6d1d9' : '#66717a'} strokeWidth=".6" />
    {rgb && <circle className="pcb-rgb-halo" r={radius} fill="none" stroke="url(#pcb-rgb)" strokeWidth="5" filter="url(#pcb-glow)" />}
    <circle r={radius} fill="url(#pcb-fan-shade)" stroke={rgb ? 'url(#pcb-rgb)' : white ? '#aeb9c2' : '#79848e'} strokeWidth="2.4" />
    <g className="pcb-fan-blades" style={{ '--fan-speed': speed } as CSSProperties} fill={rgb ? '#c3cbdd' : '#87929c'} opacity={rgb ? '.62' : '.5'}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} transform={`rotate(${Math.round(i * 360 / 7)})`} d={`M0 0 Q${radius * .75} ${-radius * .9} ${radius * .8} ${-radius * .2} Q${radius * .55} ${radius * .25} 0 0`} />)}
    </g>
    <circle r={radius * .23} fill={white ? '#8f9ba6' : '#2c3540'} stroke={white ? '#e8eef2' : '#a5afbc'} strokeWidth=".5" />
    {rgb && <circle r={radius * .23} fill="none" stroke="url(#pcb-rgb)" strokeWidth=".8" opacity=".85" />}
  </g>
  const colorText = white ? 'Gabinete branco' : color === 'black' ? 'Gabinete preto' : color === 'any' ? 'Gabinete em cor a definir' : ''
  const lightText = rgb ? 'com RGB' : lighting === 'none' ? 'sem iluminação' : lighting === 'any' ? 'com iluminação a definir' : ''
  const caption = colorText && lightText ? `${colorText}, ${lightText}` : colorText || lightText ? [colorText, lightText].filter(Boolean).join(', ') : ''
  return <div className={`pcb-case-preview ${white ? 'pcb-case-white' : ''} ${rgb ? 'pcb-case-rgb' : ''}`} role="img" aria-label={caption ? `Preferência visual: ${caption}` : 'Pré-visualização do gabinete'}>
    <svg viewBox="35 5 290 265" aria-hidden="true"><defs>
      <linearGradient id="pcb-rgb" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c5a2ff" /><stop offset=".45" stopColor="#90dce0" /><stop offset="1" stopColor="#f4afb6" /></linearGradient>
      <linearGradient id="pcb-shell" x1="0" y1="0" x2=".9" y2="1"><stop stopColor={white ? '#fbfcfd' : '#77838d'} /><stop offset=".38" stopColor={white ? '#dde5ea' : '#3c4752'} /><stop offset=".72" stopColor={white ? '#bcc8d1' : '#1f2830'} /><stop offset="1" stopColor={white ? '#93a4b1' : '#10161c'} /></linearGradient>
      <linearGradient id="pcb-interior" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#141c24" /><stop offset="1" stopColor="#0b1016" /></linearGradient>
      <linearGradient id="pcb-glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2c3d4f" stopOpacity=".38" /><stop offset=".42" stopColor="#121a23" stopOpacity=".06" /><stop offset=".72" stopColor="#7fa0c2" stopOpacity=".1" /><stop offset="1" stopColor="#93b2d3" stopOpacity=".2" /></linearGradient>
      <linearGradient id="pcb-sweep" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".14" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <linearGradient id="pcb-gpu" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#46596b" /><stop offset="1" stopColor="#222c37" /></linearGradient>
      <radialGradient id="pcb-fan-shade"><stop stopColor="#2b3846" /><stop offset="1" stopColor="#0d1218" /></radialGradient>
      <radialGradient id="pcb-floor-glow"><stop stopColor="#b69cf55e" /><stop offset=".55" stopColor="#90dce033" /><stop offset="1" stopColor="#90dce000" /></radialGradient>
      <filter id="pcb-glow"><feGaussianBlur stdDeviation="2.6" /></filter>
      <filter id="pcb-blur-8"><feGaussianBlur stdDeviation="7" /></filter>
      <clipPath id="pcb-clip-side"><rect x="10" y="9" width="131" height="151" rx="3" /></clipPath>
    </defs>
      <ellipse cx="180" cy="250" rx="102" ry="12" fill="#000" opacity=".45" filter="url(#pcb-blur-8)" />
      {rgb && <ellipse cx="180" cy="247" rx="86" ry="9" fill="url(#pcb-floor-glow)" opacity=".8" filter="url(#pcb-blur-8)" />}
      <path d="M75 45 135 20 285 45 225 70Z" fill="url(#pcb-shell)" stroke={white ? '#f2f5f8' : '#8b96a0'} strokeWidth=".7" />
      <path d="m91 44 42-17 128 22-36 15Z" fill={white ? '#aab6c0' : '#161e25'} opacity=".72" />{[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`m${115 + i * 16} ${38 + i * 2.6} 22-9`} stroke={white ? '#75828d' : '#080e15'} strokeWidth="2" />)}
      <g transform="matrix(1,.1667,0,1,75,45)">
        <rect width="150" height="170" rx="3" fill="url(#pcb-shell)" stroke={white ? '#edf2f6' : '#5d6d78'} strokeWidth="1" />
        <rect x="0" y="0" width="150" height="2.2" fill="#ffffff20" />
        <rect x="10" y="9" width="131" height="151" rx="3" fill="url(#pcb-interior)" stroke={white ? '#7e909e' : '#667682'} strokeWidth="1" />
        <rect x="11.5" y="10.5" width="128" height="148" rx="2" fill="none" stroke="#ffffff0a" strokeWidth="1" />
        <rect x="23" y="22" width="87" height="80" rx="2" fill="#1a2530" stroke="#3d4d5e" strokeWidth=".5" /><path d="M27 27h25v18H28m10 49V76h22m42-47V18m-4 47h12" fill="none" stroke="#4b5d6c" strokeWidth="1" />
        <rect x="47" y="40" width="36" height="34" rx="2" fill="#121a23" stroke="#2e3c49" strokeWidth=".5" />
        {fan(65, 57, 23, '1.9s')}
        {[0, 1].map(i => <g key={i}><rect x={100 + i * 10} y="28" width="6" height="53" rx="1" fill={white ? '#93a4b1' : '#4c5c69'} /><path d={`M${103 + i * 10} 31v47`} stroke={rgb ? 'url(#pcb-rgb)' : '#8b9ca8'} strokeWidth="2" /><path d={`M${103 + i * 10} 31v47`} stroke={rgb ? 'url(#pcb-rgb)' : '#8b9ca8'} strokeWidth="5" opacity=".35" filter="url(#pcb-glow)" /></g>)}
        <path d="M26 101h100v19H26Z" fill="url(#pcb-gpu)" stroke="#93a5b4" strokeWidth=".6" /><path d="M32 105h86" stroke={rgb ? 'url(#pcb-rgb)' : '#7c8b98'} strokeWidth="2" />{rgb && <path d="M32 105h86" stroke="url(#pcb-rgb)" strokeWidth="5" opacity=".4" filter="url(#pcb-glow)" />}<path d="M37 119v11q28 8 38 0v-10" fill="none" stroke="#080e14" strokeWidth="4" />
        <rect x="13" y="136" width="124" height="19" rx="1" fill={white ? '#aebcc7' : '#2d3a46'} /><path d="M25 141h40m-40 5h30m-30 5h19" stroke={white ? '#778894' : '#4c5e6c'} strokeWidth="1" />
        <rect x="10" y="9" width="131" height="151" rx="3" fill="url(#pcb-glass)" />
        <g clipPath="url(#pcb-clip-side)"><rect className="pcb-glass-sweep" x="-46" y="4" width="38" height="162" fill="url(#pcb-sweep)" transform="skewX(-8)" /></g>
        {[[15, 14], [136, 14], [15, 155], [136, 155]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={white ? '#c5d1d9' : '#778a99'} />)}
      </g>
      <g transform="matrix(1,-.4167,0,1,225,70)">
        <rect width="60" height="170" rx="2" fill="url(#pcb-shell)" stroke={white ? '#e6edf2' : '#6b7985'} strokeWidth=".8" />
        <rect x="6" y="15" width="48" height="143" rx="3" fill="url(#pcb-interior)" stroke="#5a6d7d" strokeWidth=".5" />
        {[40, 85, 130].map((y, i) => <g key={y}>{fan(30, y, 18, `${1.55 + i * 0.18}s`)}</g>)}
        <rect x="6" y="15" width="48" height="143" rx="3" fill="url(#pcb-glass)" />
        {[14, 22, 30, 38, 46].map(x => <path key={x} d={`M${x} 17v139`} stroke="#05090e" strokeWidth="2.6" opacity=".42" />)}
        {[14, 22, 30, 38, 46].map(x => <path key={x} d={`M${x + 1.3} 17v139`} stroke="#ffffff09" strokeWidth=".8" />)}
        <rect x="6" y="15" width="48" height="143" rx="3" fill="none" stroke="#ffffff0d" strokeWidth=".8" />
        <circle cx="30" cy="7" r="2.1" fill="#879bab" stroke="#d6e7f5" strokeWidth=".6" />{rgb && <circle cx="30" cy="7" r="3.4" fill="#d6e7f5" opacity=".35" filter="url(#pcb-glow)" />}
        <path d="M46 20v128" stroke={rgb ? 'url(#pcb-rgb)' : '#596b7a'} strokeWidth=".8" opacity=".6" />
      </g>
      <path d="M88 219v8m126 12v8m59-27v7" stroke={white ? '#92a3b0' : '#344554'} strokeWidth="7" />
    </svg>
    <AnimatePresence mode="wait" initial={false}><motion.p key={caption || 'pending'} className="pcb-case-caption" aria-hidden="true" initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -5 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>{caption || 'Sua escolha aparece aqui.'}</motion.p></AnimatePresence>
  </div>
}

export const PcBuildDelivery = ({ draft, error, onSelect }: { draft: PcBuildQuoteDraft; error?: string; onSelect: (id: string) => void }) => <fieldset id="pcb-fulfillment" tabIndex={-1} aria-invalid={!!error} aria-describedby={error ? 'pcb-fulfillment-error' : undefined}><legend className="sr-only">Como receber o PC</legend>{error && <p id="pcb-fulfillment-error" className="quote-inline-error">{error}</p>}<div className="quote-delivery-options">{[{ id: 'store', name: 'Retirar na loja', hint: 'Campo Grande, Rio de Janeiro.', icon: FiMapPin }, { id: 'delivery', name: 'Consultar entrega', hint: 'Disponibilidade e custos a confirmar.', icon: FiTruck }, { id: 'undecided', name: 'Combinar pelo WhatsApp', hint: 'Decidir com a equipe.', icon: FiHelpCircle }].map(({ id, name, hint, icon: Icon }) => <button type="button" key={id} className={`quote-delivery ${draft.fulfillment === id ? 'selected' : ''}`} aria-pressed={draft.fulfillment === id} onClick={() => onSelect(id)}><Icon aria-hidden="true" /><span><strong>{name}</strong><small>{hint}</small></span><span className="quote-radio-mark" aria-hidden="true">{draft.fulfillment === id && <FiCheck />}</span></button>)}</div>{draft.fulfillment === 'store' && <p className="quote-location-note">Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ</p>}{draft.fulfillment === 'delivery' && <p className="quote-small-print">A equipe confirma disponibilidade, condições e eventuais custos para seu endereço.</p>}</fieldset>

export const PcBuildFeasibility = ({ notice, onBudget, onPerformance, onGuidance, guidanceSelected }: { notice: PcFeasibilityNotice; onBudget: () => void; onPerformance: () => void; onGuidance: () => void; guidanceSelected: boolean }) => <aside className="pcb-feasibility" aria-label="Avaliação da meta de desempenho"><FiHelpCircle aria-hidden="true" /><div><strong>{notice.title}</strong><p>{notice.message}</p><div className="pcb-feasibility-actions"><button type="button" onClick={onBudget}>Ajustar orçamento</button><button type="button" onClick={onPerformance}>Rever desempenho</button><button type="button" onClick={onGuidance} aria-pressed={guidanceSelected}>{guidanceSelected ? 'Orientação solicitada' : 'Quero orientação'}</button></div></div></aside>
