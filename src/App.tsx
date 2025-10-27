import { PDFEditor } from './components/PDFEditor'
import { Toaster } from 'sonner'
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
