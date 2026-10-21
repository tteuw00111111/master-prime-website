import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiCopy, FiMapPin } from 'react-icons/fi'
import logoImage from '@/assets/images/logo.webp'
import { IPHONE_CATALOG_DATE_LABEL, IPHONE_PURCHASE_PATH } from '@/data/iphone-purchase'
import { getIPhoneThumbnail } from '@/data/iphone-product-images'
import type { IPhoneVariant } from '@/types/iphone-purchase'
import { buildIPhoneSalesUrl, formatIPhoneMoney } from '@/utils/iphone-purchase'
import { getIPhoneCatalogGroups, getIPhoneCatalogLink, isIPhoneQuoteEntry } from '@/utils/iphone-catalog'
import { WHATSAPP_PHONE } from '@/utils/whatsapp'
import { cleanIPhoneAttribution } from '@/utils/iphone-purchase-tracking'
import { IPhonePurchaseQuotePage } from './IPhonePurchaseQuotePage'
import '@/styles/iphone-catalog.css'

type Filter = 'all' | IPhoneVariant['condition']
const filters = [{ id: 'all', label: 'Todos' }, { id: 'sealed', label: 'Lacrados' }, { id: 'used', label: 'Seminovos' }] as const
const catalogUrl = `https://master-prime.com${IPHONE_PURCHASE_PATH}`
const groups = getIPhoneCatalogGroups()

const IPhoneCatalog = ({ onChoose }: { onChoose: (event: React.MouseEvent<HTMLAnchorElement>) => void }) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [copyStatus, setCopyStatus] = useState('')
  const [copyFallback, setCopyFallback] = useState(false)
  const reducedMotion = useReducedMotion()
  const visible = groups.filter(group => filter === 'all' || group.condition === filter)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl)
      setCopyStatus('Link do catálogo copiado.')
      setCopyFallback(false)
    } catch {
      setCopyStatus('Selecione e copie o link abaixo.')
      setCopyFallback(true)
    }
  }

  return <div className="iphone-catalog">
    <a href="#iphone-catalog-models" className="catalog-skip">Pular para os modelos</a>
    <header className="catalog-header catalog-container">
      <a href="/" aria-label="Master Prime Assistência — início"><img src={logoImage} alt="Master Prime Assistência" width={639} height={376} /></a>
      <button type="button" className="catalog-copy" onClick={() => void copyLink()}>{copyStatus === 'Link do catálogo copiado.' ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}<span>Copiar link do catálogo</span></button>
    </header>
    <main className="catalog-container">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">iPhones</span></nav>
      <motion.div className="catalog-intro" initial={false} animate={reducedMotion ? {} : { y: [8, 0] }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}>
        <h1>Seu próximo <span>iPhone.</span></h1>
        <p>Lacrados e seminovos. Escolha um modelo para consultar com a equipe.</p>
      </motion.div>
      <div className="catalog-share-feedback" role="status" aria-live="polite">{copyStatus}</div>
      {copyFallback && <div className="catalog-copy-fallback"><label htmlFor="catalog-link">Link do catálogo</label><input id="catalog-link" type="text" value={catalogUrl} readOnly onFocus={event => event.currentTarget.select()} /></div>}
      <section id="iphone-catalog-models" className="catalog-models" aria-label="Modelos de iPhone" tabIndex={-1}>
        <noscript><p className="catalog-availability">Ative o JavaScript para filtrar e preparar sua consulta, ou <a href={buildIPhoneSalesUrl('Olá! Gostaria de consultar os iPhones da Master Prime.', WHATSAPP_PHONE) ?? undefined} className="catalog-noscript-link">consulte os modelos pelo WhatsApp</a>.</p></noscript>
        <div className="catalog-toolbar">
          <div className="catalog-filters" role="group" aria-label="Filtrar por condição">{filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            {filter === item.id && <motion.span className="catalog-filter-indicator" layoutId="catalog-filter" transition={{ duration: reducedMotion ? 0 : .2, ease: [.22, 1, .36, 1] }} />}
            <span>{item.label}</span>
          </button>)}</div>
        </div>
        <div className="catalog-context"><p className="catalog-date">Tabela de {IPHONE_CATALOG_DATE_LABEL}</p><p className="catalog-availability">Disponibilidade e condições confirmadas pela equipe.</p></div>
        <p className="sr-only" role="status">{visible.length} {visible.length === 1 ? 'modelo para consulta' : 'modelos para consulta'}</p>
        {(['sealed', 'used'] as const).map(condition => {
          const models = visible.filter(group => group.condition === condition)
          if (!models.length) return null
          return <section key={condition} className={`catalog-section catalog-section-${condition}`} aria-labelledby={`catalog-heading-${condition}`}>
            <div className="catalog-section-heading"><h2 id={`catalog-heading-${condition}`}>{condition === 'sealed' ? 'Lacrados' : 'Seminovos'}</h2><span>{models.length} modelos</span></div>
            {condition === 'used' && <p className="catalog-used-note">Escolha as cores que você aceita. Disponibilidade, bateria e estado da unidade confirmados pela equipe.</p>}
            <div className={condition === 'sealed' ? 'catalog-sealed-grid' : 'catalog-used-grid'}>{models.map(group => {
              const thumbnail = getIPhoneThumbnail(group.modelId, group.cheapest.colorId, group.condition)
              const capacities = [...new Set(group.variants.map(variant => variant.capacity))]
              const from = group.variants.some(variant => variant.cashCents !== group.cheapest.cashCents)
              return <article key={`${group.modelId}-${condition}`} className={`catalog-product ${condition === 'sealed' ? 'catalog-product-sealed' : 'catalog-product-used'}`}>
                {thumbnail && <a className="catalog-product-image" href={getIPhoneCatalogLink(group.cheapest)} onClick={onChoose} tabIndex={-1} aria-hidden="true"><img src={thumbnail} alt="" width={1090} height={1400} loading={condition === 'sealed' ? 'eager' : 'lazy'} decoding="async" /></a>}
                <div className="catalog-product-info">
                  <h3>{group.model}</h3>
                  <p className="catalog-capacities">{capacities.map(capacity => `${capacity} GB`).join(' ou ')}</p>
                  {condition === 'sealed' && <p className="catalog-colors">{[...new Set(group.variants.map(variant => variant.colorId))].length} cores para consultar</p>}
                  <div className="catalog-price">{from && <p className="catalog-from">A partir de</p>}<p><strong>{formatIPhoneMoney(group.cheapest.cashCents)}</strong><span> à vista</span></p><p className="catalog-installments">ou 12× de {formatIPhoneMoney(group.cheapest.installmentCents)} no cartão</p></div>
                  <a className="catalog-product-action" href={getIPhoneCatalogLink(group.cheapest)} onClick={onChoose} aria-label={`Ver opções de ${group.model} ${condition === 'used' ? 'seminovo' : 'lacrado'}`}>Ver opções <FiArrowRight aria-hidden="true" /></a>
                </div>
              </article>
            })}</div>
          </section>
        })}
        {!visible.length && <p className="catalog-empty">Não há modelos para consulta nesta condição. Consulte a equipe na loja.</p>}
      </section>
      <section className="catalog-visit" aria-labelledby="catalog-visit-heading"><FiMapPin aria-hidden="true" /><div><h2 id="catalog-visit-heading">Vamos escolher juntos?</h2><p>Visite a Master Prime Assistência.<br />Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ</p></div></section>
    </main>
    <footer className="catalog-footer catalog-container"><a href="/"><FiArrowLeft aria-hidden="true" /> Voltar ao site</a><a href="/orcamento/celular">Preciso de reparo no meu celular</a><a href="/politica-de-privacidade">Privacidade</a></footer>
  </div>
}

// Hydrate the same catalog HTML as the server, then honor existing campaign links.
// In-page navigation keeps model entry immediate and supports browser back/forward.
export const IPhoneCatalogPage = () => {
  const [showQuote, setShowQuote] = useState(false)
  useEffect(() => {
    const sync = () => setShowQuote(isIPhoneQuoteEntry(window.location.search))
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const choose = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const url = new URL(event.currentTarget.href)
    const attribution = cleanIPhoneAttribution(new URLSearchParams(window.location.search))
    for (const [key, value] of Object.entries(attribution)) url.searchParams.set(key, value)
    window.history.pushState(null, '', `${url.pathname}${url.search}`)
    setShowQuote(true)
    window.scrollTo(0, 0)
  }
  return showQuote ? <IPhonePurchaseQuotePage /> : <IPhoneCatalog onChoose={choose} />
}
