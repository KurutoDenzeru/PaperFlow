import { Toaster } from 'sonner'
import { PDFEditor } from './components/pdf-editor/pdf-editor'

function App() {
  return (
    <>
      <PDFEditor />
      <Toaster position="top-right" />
    </>
  )
}

export default App
