import type { CatalogModel } from '@/types/quote'

// Identification only. These sources establish product names, not availability
// of repairs, parts or manufacturer authorization. Reviewed 2026-10-15.
export const SMARTPHONE_CATALOG_SOURCES = {
  apple: 'https://support.apple.com/pt-br/108044',
  samsung: 'https://www.samsung.com/br/support/self-repair/',
  samsungProducts: 'https://www.samsung.com/global/sustainability/policy-file/AYVhR1k6BicAIx95/LCA%20Results%20for%20Smartphones.pdf',
  motorola: 'https://www.motorola.com.br/familia-5g',
  motorolaNfc: 'https://www.motorola.com.br/celulares-com-nfc',
  xiaomi: 'https://www.mi.com/br/support/user-guide/',
  asus: 'https://rog.asus.com/phones-group/allmodels/',
  zenfone: 'https://press.asus.com/news/statements/asus-zenfone-10-to-continue-production',
  lg: 'https://www.lg.com/cac/telefonos-celulares/view-all',
  nokia: 'https://www.hmd.com/en_sa/support/user-guides',
  realmeC67: 'https://www.realme.com/br/realme-c67',
  realmeC75: 'https://www.realme.com/br/realme-c75',
  realme12ProPlus: 'https://www.realme.com/br/realme-12-pro-plus/specs',
  realme13ProPlus: 'https://www.realme.com/global/realme-13-pro-plus-5g',
  oppo: 'https://www.oppo.com/br/smartphones/',
  huawei: 'https://consumer.huawei.com/cn/support/content/zh-cn15997801/',
  infinix: 'https://gulf.infinixmobility.com/manual',
  tecnoCamon: 'https://www.tecno-mobile.com/phones/product-detail/product/camon-30-5g/',
  tecnoPova: 'https://www.tecno-mobile.com/phones/tech-specs/techspecs/pova-6-pro-5g/',
  tecno: 'https://www.tecno-mobile.com/ar/',
} as const

const entries = (brandId: string, source: string, names: readonly string[], extraAliases: Record<string, string[]> = {}): CatalogModel[] => names.map(name => {
  const short = name.replace(/^(?:Galaxy|motorola|moto|Nokia|realme|OPPO|HUAWEI|Infinix|TECNO) /i, '')
  const aliases = new Set([
    short, name.replace(/\+/g, ' Plus '), short.replace(/\+/g, ' Plus '),
    ...(brandId === 'samsung' ? [`Samsung ${short}`, `Samsung ${name}`] : []),
    ...(brandId === 'motorola' ? [`Motorola ${short}`, `Moto ${short}`] : []),
    ...(brandId === 'xiaomi' ? [`Xiaomi ${name}`] : []),
    ...(brandId === 'asus' ? [`ASUS ${name}`] : []),
    ...(extraAliases[name] ?? []),
  ])
  aliases.delete(name)
  return {
    // Preserve original IDs, including edge-* and pro-plus-* identifiers.
    id: name.replace(/^motorola /i, '').toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name, brandId, aliases: [...aliases], source,
  }
})

const source = SMARTPHONE_CATALOG_SOURCES
export const SMARTPHONE_MODELS: CatalogModel[] = [
  ...entries('apple', source.apple, [
    'iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e',
    'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone 17e', 'iPhone Air',
    'iPhone 18 Pro', 'iPhone 18 Pro Max',
    'iPhone SE (2ª geração)', 'iPhone SE (3ª geração)',
  ], { 'iPhone SE (2ª geração)': ['iPhone SE 2020', 'iPhone SE 2'], 'iPhone SE (3ª geração)': ['iPhone SE 2022', 'iPhone SE 3'] }),
  ...entries('samsung', source.samsung, [
    'Galaxy A15', 'Galaxy A25', 'Galaxy A35', 'Galaxy A55',
    'Galaxy S20', 'Galaxy S20+', 'Galaxy S20 Ultra',
    'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra',
    'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
    'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE',
    'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE',
    'Galaxy Z Fold5', 'Galaxy Z Flip5', 'Galaxy Z Fold6', 'Galaxy Z Flip6',
  ], { 'Galaxy A25': ['Galaxy A25 5G'], 'Galaxy A35': ['Galaxy A35 5G'], 'Galaxy A55': ['Galaxy A55 5G'] }),
  ...entries('samsung', source.samsungProducts, [
    'Galaxy A15 5G', 'Galaxy A16', 'Galaxy A16 5G', 'Galaxy A17', 'Galaxy A17 5G',
    'Galaxy A26 5G', 'Galaxy A27 5G', 'Galaxy A36 5G', 'Galaxy A37 5G', 'Galaxy A56 5G', 'Galaxy A57 5G',
    'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra', 'Galaxy S25 FE', 'Galaxy S25 Edge',
    'Galaxy S26', 'Galaxy S26+', 'Galaxy S26 Ultra', 'Galaxy S26 FE',
    'Galaxy Z Fold7', 'Galaxy Z Flip7', 'Galaxy Z Flip7 FE', 'Galaxy Z Fold8', 'Galaxy Z Fold8 Ultra', 'Galaxy Z Flip8', 'Galaxy Z TriFold',
    'Galaxy M15 5G', 'Galaxy M34 5G', 'Galaxy M35 5G', 'Galaxy M44 5G',
  ]),
  ...entries('motorola', source.motorola, [
    'moto g34 5G', 'moto g54 5G', 'moto g84 5G', 'moto g85 5G',
    'motorola edge 40 neo', 'motorola edge 50', 'motorola edge 50 fusion',
    'motorola edge 50 neo', 'motorola edge 50 pro', 'motorola edge 50 ultra',
    'motorola razr 40', 'motorola razr 40 ultra', 'motorola razr 50', 'motorola razr 50 ultra',
  ], { 'moto g54 5G': ['Moto G54', 'Motorola G54'], 'moto g84 5G': ['Moto G84', 'Motorola G84'] }),
  ...entries('motorola', source.motorolaNfc, ['moto g55 5G', 'motorola edge 70 5G']),
  ...entries('xiaomi', source.xiaomi, [
    'Redmi Note 8 Pro', 'Redmi Note 9', 'Redmi Note 9S', 'Redmi Note 9 Pro',
    'Redmi Note 10', 'Redmi Note 10 5G', 'Redmi Note 10S',
    'Redmi Note 11', 'Redmi Note 11S', 'Redmi Note 11S 5G', 'Redmi Note 11 Pro', 'Redmi Note 11 Pro 5G', 'Redmi Note 11 Pro+ 5G',
    'Redmi Note 12', 'Redmi Note 12 5G', 'Redmi Note 12S', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro 5G',
    'Redmi Note 13', 'Redmi Note 13 5G', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro 5G', 'Redmi Note 13 Pro+ 5G',
    'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 10', 'Redmi 10A', 'Redmi 10C', 'Redmi 10 2022',
    'Redmi 12', 'Redmi 12C', 'Redmi 13C', 'Redmi A1', 'Redmi A2',
    'POCO X3 NFC', 'POCO X3 Pro', 'POCO X4 Pro 5G', 'POCO X4 GT',
    'POCO X5 5G', 'POCO X5 Pro 5G', 'POCO X6 5G', 'POCO X6 Pro 5G',
    'POCO M3 Pro 5G', 'POCO M4 Pro', 'POCO M4 Pro 5G', 'POCO M4 5G', 'POCO M5s', 'POCO M6 Pro',
    'POCO C40', 'POCO C65', 'POCO F5', 'Xiaomi 13T',
  ], { 'POCO X6 Pro 5G': ['Poco X6 Pro'] }),
  ...entries('asus', source.asus, ['ROG Phone 8', 'ROG Phone 8 Pro', 'ROG Phone 8 Pro Edition', 'ROG Phone 9', 'ROG Phone 9 Pro', 'ROG Phone 9 Pro Edition']),
  ...entries('asus', source.zenfone, ['Zenfone 10']),
  ...entries('lg', source.lg, ['LG K41S', 'LG K51S', 'LG K61', 'LG K52', 'LG K62', 'LG Velvet', 'LG G8X ThinQ']),
  ...entries('nokia', source.nokia, [
    'Nokia C10', 'Nokia C20', 'Nokia C21', 'Nokia C22', 'Nokia C30', 'Nokia C31', 'Nokia C32',
    'Nokia G10', 'Nokia G11', 'Nokia G11 Plus', 'Nokia G20', 'Nokia G21', 'Nokia G50', 'Nokia G60 5G',
    'Nokia X10', 'Nokia X20', 'Nokia X30 5G', 'Nokia XR20', 'Nokia 5.4', 'Nokia 8.3 5G',
  ]),
  ...entries('realme', source.realmeC67, ['realme C67']),
  ...entries('realme', source.realmeC75, ['realme C75']),
  ...entries('realme', source.realme12ProPlus, ['realme 12 Pro+ 5G']),
  ...entries('realme', source.realme13ProPlus, ['realme 13 Pro+ 5G']),
  ...entries('oppo', source.oppo, [
    'OPPO A40', 'OPPO A58', 'OPPO A60', 'OPPO A79 5G', 'OPPO A5', 'OPPO A5 5G', 'OPPO A5 Pro 5G',
    'OPPO A6', 'OPPO A6 Pro 5G', 'OPPO A6x', 'OPPO A6x 5G', 'OPPO A6t', 'OPPO A6t 5G', 'OPPO A6k', 'OPPO A6s',
    'OPPO Reno13 5G', 'OPPO Reno13 F 5G', 'OPPO Reno14 5G', 'OPPO Reno14 F 5G',
    'OPPO Reno16 5G', 'OPPO Reno16 F 5G', 'OPPO Find X9 Pro',
  ]),
  ...entries('huawei', source.huawei, [
    'HUAWEI P30', 'HUAWEI P30 Pro', 'HUAWEI P40', 'HUAWEI P40 Pro', 'HUAWEI P40 Pro+',
    'HUAWEI P50', 'HUAWEI P50 Pro', 'HUAWEI P60', 'HUAWEI P60 Pro',
    'HUAWEI Pura 70', 'HUAWEI Pura 70 Pro', 'HUAWEI Pura 70 Pro+', 'HUAWEI Pura 70 Ultra',
    'HUAWEI nova 9', 'HUAWEI nova 10', 'HUAWEI nova 10 Pro', 'HUAWEI nova 11', 'HUAWEI nova 11 Pro',
    'HUAWEI Mate 50', 'HUAWEI Mate 50 Pro', 'HUAWEI Mate 60', 'HUAWEI Mate 60 Pro',
  ]),
  ...entries('infinix', source.infinix, ['Infinix NOTE 40', 'Infinix HOT 40 Pro', 'Infinix SMART 8 Pro']),
  ...entries('tecno', source.tecnoCamon, ['TECNO CAMON 30', 'TECNO CAMON 30 5G', 'TECNO CAMON 30 Pro 5G', 'TECNO CAMON 30 Premier 5G']),
  ...entries('tecno', source.tecnoPova, ['TECNO POVA 6 Pro 5G']),
  ...entries('tecno', source.tecno, ['TECNO CAMON 30S Pro', 'TECNO POVA 6', 'TECNO SPARK 20 Pro']),
]
