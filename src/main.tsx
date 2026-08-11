import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/fonts.css'
import './styles/globals.css'

const rootElement = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <App pathname={window.location.pathname} />
  </React.StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
