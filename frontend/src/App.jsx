<<<<<<< HEAD
import { useState } from 'react'
import './App.css'
=======
import { Routes, Route } from "react-router-dom";
>>>>>>> 64a3ae58bfcb108d628f33450292d0cbfc3633b2

import LoginPage from "./pages/auth/LoginPage";
import OAuth2RedirectHandler from "./pages/auth/OAuth2RedirectHandler";
import MainPage from "./pages/main/MainPage";
import PracticePage from "./pages/practice/PracticePage";
import SoloPracticePage from "./pages/practice/SoloPracticePage";
import AiPracticePage from "./pages/practice/AiPracticePage";
import TogetherPage from "./pages/together/TogetherPage";
import MakeRoomPage from "./pages/together/MakeRoomPage";
import JoinRoomPage from "./pages/together/JoinRoomPage";
import WaitingRoomPage from "./pages/together/WaitingRoomPage";
import TogetherTalkPage from "./pages/together/TogetherTalkPage";
import RecordingPage from "./pages/recording/RecordingPage";
import MyPage from "./pages/mypage/MyPage";
import MiniGame1Page from "./pages/minigame/MiniGame1Page";
import MiniGame2Page from "./pages/minigame/MiniGame2Page";

export default function App() {
  return (
<<<<<<< HEAD
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
=======
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      <Route path="/" element={<MainPage />} />

      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/solo" element={<SoloPracticePage />} />
      <Route path="/practice/ai" element={<AiPracticePage />} />

      <Route path="/together" element={<TogetherPage />} />
      <Route path="/together/make" element={<MakeRoomPage />} />
      <Route path="/together/join" element={<JoinRoomPage />} />
      <Route path="/together/waiting" element={<WaitingRoomPage />} />
      <Route path="/together/talk" element={<TogetherTalkPage />} />

      <Route path="/recording" element={<RecordingPage />} />

      <Route path="/mypage" element={<MyPage />} />

      <Route path="/minigame1" element={<MiniGame1Page />} />
      <Route path="/minigame2" element={<MiniGame2Page />} />
    </Routes>
  );
}
>>>>>>> 64a3ae58bfcb108d628f33450292d0cbfc3633b2
