import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/manrope'
import './styles.css'
import App from './App'
import { warmApi } from './api'
import { pwa } from './lib/pwa'

// import.meta.url é o arquivo JS deste deploy: serve para saber se a página ficou velha.
pwa.start({ serviceWorker: import.meta.env.PROD, scriptUrl: import.meta.url })
warmApi()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
