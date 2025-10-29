import { Toaster } from 'sonner'
import { PDFEditor } from './components/pdf-editor/pdf-editor'
import './App.css'

function App() {
  return (
    <>
      <PDFEditor />
      <Toaster position="top-right" />
    </>
  )
}

export default App
