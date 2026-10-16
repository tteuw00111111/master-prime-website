import { NOTEBOOK_QUOTE_PATH } from '@/data/notebook-quote'
import { SMARTPHONE_QUOTE_PATH } from '@/data/smartphone-quote'
import { COMPUTER_QUOTE_PATH } from '@/data/computer-quote'
import { GAMING_QUOTE_PATH } from '@/data/gaming-quote'
import { PC_BUILD_QUOTE_PATH } from '@/data/pc-build-quote'

export const HOME_QUOTE_HREF = '/#orcamento'

export const QUOTE_DESTINATIONS = {
  notebook: NOTEBOOK_QUOTE_PATH,
  smartphone: SMARTPHONE_QUOTE_PATH,
  computer: COMPUTER_QUOTE_PATH,
  pcGamer: `${COMPUTER_QUOTE_PATH}?tipo=pc-gamer`,
  console: `${GAMING_QUOTE_PATH}?aparelho=videogame`,
  controller: `${GAMING_QUOTE_PATH}?aparelho=controle`,
  pcBuild: PC_BUILD_QUOTE_PATH,
} as const
