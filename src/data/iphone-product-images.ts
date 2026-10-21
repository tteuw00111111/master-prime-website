import orange from '@/assets/images/iphone/apple-17-pro-max/orange.webp'
import blue from '@/assets/images/iphone/apple-17-pro-max/blue.webp'
import silver from '@/assets/images/iphone/apple-17-pro-max/silver.webp'
import orangeDetail from '@/assets/images/iphone/apple-17-pro-max/orange-detail.webp'
import blueDetail from '@/assets/images/iphone/apple-17-pro-max/blue-detail.webp'
import silverDetail from '@/assets/images/iphone/apple-17-pro-max/silver-detail.webp'
import proModel from '@/assets/models/iphone/iphone-17-pro.glb?url'
import black18 from '@/assets/images/iphone/apple-18-pro-max/black.webp'
import burgundy18 from '@/assets/images/iphone/apple-18-pro-max/burgundy.webp'
import silver18 from '@/assets/images/iphone/apple-18-pro-max/silver.webp'
import black18Detail from '@/assets/images/iphone/apple-18-pro-max/black-detail.webp'
import burgundy18Detail from '@/assets/images/iphone/apple-18-pro-max/burgundy-detail.webp'
import silver18Detail from '@/assets/images/iphone/apple-18-pro-max/silver-detail.webp'
import pro18Model from '@/assets/models/iphone/iphone-18-pro.glb?url'
import { getIPhoneUsedColors } from './iphone-used-colors'
import { IPHONE_USED_PRODUCT_IMAGES } from './iphone-used-product-images'

// Original Apple Store Pro Max renders supplied by the user; see sources.json.
// Shared Pro detail photos and geometry are authorized for design presentation.
// Used-model renders are references, never photos of an individual store unit.
interface IPhoneGalleryImage { front: string; back: string; detail?: string; name: string; detailAnchor?: string }
const galleries: Record<string, Record<string, IPhoneGalleryImage>> = {
  'iphone-17-pro-max': {
    orange: { back: orange, front: orange, detail: orangeDetail, name: 'Laranja' },
    blue: { back: blue, front: blue, detail: blueDetail, name: 'Azul' },
    silver: { back: silver, front: silver, detail: silverDetail, name: 'Prateado' },
  },
  'iphone-18-pro-max': {
    black: { back: black18, front: black18, detail: black18Detail, name: 'Preto', detailAnchor: '66.4%' },
    burgundy: { back: burgundy18, front: burgundy18, detail: burgundy18Detail, name: 'Bordô', detailAnchor: '66.4%' },
    silver: { back: silver18, front: silver18, detail: silver18Detail, name: 'Prateado', detailAnchor: '66.4%' },
  },
}
const usedGalleries: Record<string, Record<string, IPhoneGalleryImage>> = Object.fromEntries(Object.entries(IPHONE_USED_PRODUCT_IMAGES).map(([modelId, images]) => [modelId, Object.fromEntries(getIPhoneUsedColors(modelId).map(color => [color.id, { front: images[color.id], back: images[color.id], name: color.name }]))]))
export const getIPhoneGallery = (modelId: string, condition = 'sealed') => condition === 'used' ? usedGalleries[modelId] : galleries[modelId]
export const getIPhoneThumbnail = (modelId: string, colorId: string, condition: string) => {
  const gallery = getIPhoneGallery(modelId, condition)
  return gallery?.[colorId || (condition === 'used' ? Object.keys(gallery ?? {})[0] : '')]?.front
}
const models: Record<string, { src: string; variants: string[] }> = {
  'iphone-17-pro-max': { src: proModel, variants: ['orange', 'blue', 'silver'] },
  'iphone-18-pro-max': { src: pro18Model, variants: ['black', 'burgundy', 'silver'] },
}
export const getIPhone3D = (modelId: string, condition: string) => condition === 'sealed' ? models[modelId] : undefined
