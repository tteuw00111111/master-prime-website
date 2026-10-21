import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { FiBox, FiSmartphone } from 'react-icons/fi'
import { getIPhone3D, getIPhoneGallery } from '@/data/iphone-product-images'
import { IPhoneModelViewer } from './IPhoneModelViewer'

type View = 'front' | 'detail'
type Frame = { src: string; view: View; color: string; name: string }
const views = [{ id: 'front', label: 'Visão geral' }, { id: 'detail', label: 'Detalhes' }] as const

export const IPhoneHero = ({ modelId, model, colorId, condition }: { modelId: string; model: string; colorId: string; condition: string }) => {
  const gallery = getIPhoneGallery(modelId, condition)
  const color = gallery?.[colorId] ? colorId : Object.keys(gallery ?? {})[0]
  const selected = gallery?.[color]
  const media3D = getIPhone3D(modelId, condition)
  const modelSource = media3D?.src
  const [view, setView] = useState<View>('front')
  const [exploring, setExploring] = useState(false)
  const [frame, setFrame] = useState<Frame | null>(() => selected ? { src: selected.front, view: 'front', color, name: selected.name } : null)
  const [previous, setPrevious] = useState<Frame | null>(null)
  const [failed, setFailed] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const desired = selected?.[view]

  useEffect(() => {
    // These are optional browser hints, not a device-quality prediction.
    // Keep a manual 3D option even when automatic loading is avoided.
    const hints = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } }
    const conserve = hints.connection?.saveData
      || ['slow-2g', '2g', '3g'].includes(hints.connection?.effectiveType || '')
      || (hints.deviceMemory !== undefined && hints.deviceMemory <= 2)
      || (hints.hardwareConcurrency > 0 && hints.hardwareConcurrency <= 2)
    setExploring(!!modelSource && !conserve)
  }, [modelSource])

  useEffect(() => {
    let active = true
    if (!desired || !selected || failed.includes(desired) || desired === frame?.src) { setPending(false); return }
    setPending(true)
    const image = new Image()
    image.src = desired
    void image.decode().then(() => {
      if (!active) return
      setPrevious(frame)
      setFrame({ src: desired, view, color, name: selected.name })
      setPending(false)
    }).catch(() => {
      if (!active) return
      setFailed(values => [...values, desired]); setPending(false)
    })
    return () => { active = false }
  }, [desired, selected, color, view, frame, failed])

  useEffect(() => {
    if (!previous) return
    // Retain the decoded outgoing image until the full dissolve has finished.
    const timeout = window.setTimeout(() => setPrevious(null), 480)
    return () => window.clearTimeout(timeout)
  }, [previous])

  const broken = !!desired && failed.includes(desired)
  return <section className="iphone-gallery" aria-label={`Imagens de ${model}`}>
    {selected ? <>
      <div className={`iphone-gallery-stage ${condition === 'used' ? 'is-used' : ''} ${view === 'detail' && !exploring ? 'is-detail' : ''} ${previous && frame && previous.view !== frame.view ? 'is-changing-view' : ''}`} style={{ '--iphone-detail-anchor': selected.detailAnchor ?? '63.2%' } as CSSProperties} aria-busy={pending || undefined}>
        {exploring && media3D ? <IPhoneModelViewer src={media3D.src} color={color} colorName={selected.name} poster={selected.front} model={model} /> : broken ?
          <div className="iphone-gallery-empty"><FiSmartphone aria-hidden="true" /><span>Esta imagem não está disponível.</span><button type="button" onClick={() => setFailed(values => values.filter(value => value !== desired))}>Tentar novamente</button></div> :
          [previous, frame].map((item, index) => item && <img key={`${index}-${item.src}`} src={item.src}
            alt={index === 1 ? `${model}, ${item.name}, ${item.view === 'detail' ? 'detalhe das câmeras' : 'frente e traseira'}` : ''}
            aria-hidden={index === 0 || undefined} width={item.view === 'front' ? 1090 : 1600} height={item.view === 'front' ? 1400 : 844}
            decoding="async"
            data-color={item.color} data-angle={item.view} className={`iphone-gallery-image ${index === 1 ? 'active' : 'outgoing'} ${previous && index === 1 ? 'is-entering' : ''}`}
            onError={() => setFailed(values => [...values, item.src])} />)}
      </div>
      {(selected.detail || media3D) && <div className="iphone-gallery-views" role="group" aria-label="Visualização do aparelho">
        {exploring ? <button type="button" onClick={() => setExploring(false)}>Voltar às fotos</button> : <>
          {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}
          {media3D && <button type="button" className="iphone-explore" onClick={() => setExploring(true)}><FiBox aria-hidden="true" />Explorar em 3D</button>}
        </>}
      </div>}
      {condition === 'used' && <p className="iphone-reference-note">Imagem de referência. Fotos da unidade no WhatsApp.</p>}
    </> : <div className="iphone-gallery-empty"><FiSmartphone aria-hidden="true" /><p>{model}</p><span>{condition === 'used' ? 'Fotos da unidade na consulta' : 'Fotos na consulta'}</span></div>}
  </section>
}
