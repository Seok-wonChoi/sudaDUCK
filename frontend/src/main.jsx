import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// [수정] 변수 대신 직접 '/dev'를 입력해서 테스트해 봅시다.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 개발 서버인 경우 '/dev'를 강제로 설정 */}
    <BrowserRouter basename="/dev">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)