import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        {/* public 폴더에 있는 이미지는 /로 바로 접근해서 안전합니다 */}
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>DuckDuck + Docker Test</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
           <code>npm run build</code> 에러가 나지 않을 거예요!
        </p>
      </div>
      <p className="read-the-docs">
        도커 빌드 테스트 중입니다.
      </p>
    </>
  )
}

export default App