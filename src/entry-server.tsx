/* eslint-disable react-refresh/only-export-components */
import { renderToString } from 'react-dom/server'
import App from './App'

export { getPageMetadata, getPageSchemas, PUBLIC_INDEXABLE_PATHS } from './utils/seo'

export const render = (pathname: string) => renderToString(<App pathname={pathname} />)
