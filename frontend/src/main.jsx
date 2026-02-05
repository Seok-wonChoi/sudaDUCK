import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// import "./styles/cursor.css";

// [핵심] Vite가 상황에 맞춰서 알아서 값을 바꿔줍니다.
// 로컬 실행 시: '/' 
// 젠킨스 배포 시: '/dev/'
const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 변수(basename)를 넣어야 로컬/배포 둘 다 살아남습니다! */}
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)