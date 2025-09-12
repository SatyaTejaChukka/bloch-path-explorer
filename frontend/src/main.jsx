import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// Font Imports
// Poppins for headings
// Inter for body text
// Fira Code for code snippets
// You might need to link these from Google Fonts or self-host them
// For now, we'll assume they are available or linked in index.html

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DndProvider backend={HTML5Backend}>
      <App />
    </DndProvider>
  </StrictMode>,
)
