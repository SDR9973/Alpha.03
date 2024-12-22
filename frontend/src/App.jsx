import { useState } from 'react'
import './App.css'
import UploadWhatsAppFile from './pages/Form.jsx';
import Menu from './components/Menu/Menu.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Menu />
           <div className="upload-section">
        <UploadWhatsAppFile />
      </div>
    </>
  )
}

export default App
