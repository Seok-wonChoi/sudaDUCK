import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css' // ?�� CSS ?�포??추�?

// [?�심] Vite가 ?�황??맞춰???�아??값을 바꿔줍니??
// 로컬 ?�행 ?? '/' 
// ?�킨??배포 ?? '/dev/'
const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 변??basename)�??�어??로컬/배포 ?????�아?�습?�다! */}
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
