import { useState } from 'react'
import ChatView from './components/ChatView'
import type { FigureId } from './types'

function App() {
  const [currentFigure, setCurrentFigure] = useState<FigureId>(() => {
    return (sessionStorage.getItem('logos-current-figure') as FigureId) || 'god'
  })

  const handleSwitch = (figure: FigureId) => {
    sessionStorage.setItem('logos-current-figure', figure)
    setCurrentFigure(figure)
  }

  return <ChatView key={currentFigure} figure={currentFigure} onSwitch={handleSwitch} />
}

export default App
