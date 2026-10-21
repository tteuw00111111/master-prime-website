import { createElement, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { ModelViewerElement } from '@google/model-viewer'

const presets = [
  { id: 'front', label: 'Frente', orbit: '180deg 90deg 105%', target: 'auto auto auto' },
  { id: 'back', label: 'Traseira', orbit: '-25deg 80deg 105%', target: 'auto auto auto' },
  { id: 'camera', label: 'Câmeras', orbit: '-25deg 75deg 65%', target: 'auto 0.055m auto' },
] as const

export const IPhoneModelViewer = ({ src, color, colorName, poster, model }: { src: string; color: string; colorName: string; poster: string; model: string }) => {
  const [registered, setRegistered] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preset, setPreset] = useState('back')
  const viewer = useRef<ModelViewerElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let active = true
    // Give hydration and the first photo paint priority over the optional runtime.
    const start = () => {
      if (!active) return
      // The loader can report success even when no GPU renderer exists.
      try {
        const context = document.createElement('canvas').getContext('webgl2')
        if (!context) { setFailed(true); return }
        context.getExtension('WEBGL_lose_context')?.loseContext()
      } catch { setFailed(true); return }
      void import('@google/model-viewer').then(() => { if (active) setRegistered(true) }).catch(() => { if (active) setFailed(true) })
    }
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 1200 }) : undefined
    const timer = idle === undefined ? window.setTimeout(start, 200) : undefined
    return () => { active = false; if (idle !== undefined) window.cancelIdleCallback(idle); if (timer !== undefined) window.clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const element = viewer.current
    if (!registered || !element) return
    const onLoad = () => { setLoaded(true); setProgress(100) }
    const onError = () => { setFailed(true); setLoaded(false) }
    const onProgress = (event: Event) => setProgress(Math.round((event as CustomEvent<{ totalProgress: number }>).detail.totalProgress * 100))
    const onCamera = (event: Event) => { if ((event as CustomEvent<{ source: string }>).detail.source === 'user-interaction') setPreset('') }
    element.addEventListener('load', onLoad)
    element.addEventListener('error', onError)
    element.addEventListener('progress', onProgress)
    element.addEventListener('camera-change', onCamera)
    if (element.loaded) onLoad()
    const timeout = window.setTimeout(() => { if (!element.loaded) onError() }, 20000)
    return () => {
      window.clearTimeout(timeout)
      element.removeEventListener('load', onLoad)
      element.removeEventListener('error', onError)
      element.removeEventListener('progress', onProgress)
      element.removeEventListener('camera-change', onCamera)
    }
  }, [registered])

  const choose = (next: typeof presets[number]) => {
    if (!viewer.current) return
    viewer.current.cameraOrbit = next.orbit
    viewer.current.cameraTarget = next.target
    if (reducedMotion) viewer.current.jumpCameraToGoal()
    setPreset(next.id)
  }

  return <div className={`iphone-model ${loaded && !failed ? 'is-loaded' : ''}`}>
    <div className="iphone-model-canvas">
      {registered && !failed && createElement('model-viewer', {
        ref: viewer, src, 'variant-name': color, alt: `${model}, ${colorName}, visualização interativa`,
        'camera-controls': true, 'touch-action': 'pan-y', 'disable-pan': true,
        'camera-orbit': '-25deg 80deg 105%', 'min-camera-orbit': 'auto 35deg 60%', 'max-camera-orbit': 'auto 145deg 140%',
        'field-of-view': '30deg', 'min-field-of-view': '30deg', 'max-field-of-view': '30deg',
        'interaction-prompt': 'none', 'shadow-intensity': '0', exposure: '1',
        'interpolation-decay': reducedMotion ? '0' : '80', loading: 'eager', reveal: 'auto',
      })}
      {(!loaded || failed) && <img className="iphone-model-poster" src={poster} alt={`${model}, imagem do aparelho`} />}
      {(!loaded || failed) && <p className="iphone-model-status" role="status">{failed ? '3D indisponível. Você pode continuar pelas fotos.' : `Carregando 3D${progress ? ` · ${progress}%` : '…'}`}</p>}
    </div>
    {loaded && !failed && <div className="iphone-model-controls" role="group" aria-label="Posição da câmera 3D">
      {presets.map(item => <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => choose(item)}>{item.label}</button>)}
      <span>Arraste para girar</span>
    </div>}
  </div>
}
