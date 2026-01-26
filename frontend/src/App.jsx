import { Routes, Route } from "react-router-dom";

// Main
import MainPage from "./pages/main/MainPage";

// Practice
import PracticePage from "./pages/practice/PracticePage";
import SoloPracticePage from "./pages/practice/SoloPracticePage";
import AiPracticePage from "./pages/practice/AiPracticePage";

// Together
import TogetherPage from "./pages/together/TogetherPage";
import MakeRoomPage from "./pages/together/MakeRoomPage";
import RoomCreatedPage from "./pages/together/RoomCreatedPage";
import JoinRoomPage from "./pages/together/JoinRoomPage";
import WaitingRoomPage from "./pages/together/WaitingRoomPage";
import TogetherTalkPage from "./pages/together/TogetherTalkPage";

// Recording
import RecordingPage from "./pages/recording/RecordingPage";

// MyPage
import MyPage from "./pages/mypage/MyPage";

// MiniGame
import MiniGame1Page from "./pages/minigame/MiniGame1Page";
import MiniGame2Page from "./pages/minigame/MiniGame2Page";

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
