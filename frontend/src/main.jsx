import React, { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark flex items-center justify-center font-serif italic text-zinc-500">
        Loading quiet thoughts...
      </div>
    }>
      <App />
    </Suspense>
  </StrictMode>,
)
