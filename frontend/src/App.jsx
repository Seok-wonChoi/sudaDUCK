import { Routes, Route } from "react-router-dom";

import MainPage from "./pages/MainPage";
import PracticePage from "./pages/PracticePage";
import SoloPracticePage from "./pages/SoloPracticePage";
import AiPracticePage from "./pages/AiPracticePage";
import TogetherPage from "./pages/TogetherPage";
import MakeRoomPage from "./pages/MakeRoomPage";
import RoomCreatedPage from "./pages/RoomCreatedPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import TogetherTalkPage from "./pages/TogetherTalkPage";
import RecordingPage from "./pages/RecordingPage";
import MyPage from "./pages/MyPage";
import MiniGame1Page from "./pages/MiniGame1Page";
import MiniGame2Page from "./pages/MiniGame2Page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />

      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/solo" element={<SoloPracticePage />} />
      <Route path="/practice/ai" element={<AiPracticePage />} />

      <Route path="/together" element={<TogetherPage />} />
      <Route path="/together/make" element={<MakeRoomPage />} />
      <Route path="/together/created" element={<RoomCreatedPage />} />
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
