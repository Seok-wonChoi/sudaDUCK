import { Routes, Route } from "react-router-dom";

import MainPage from "./pages/Main/MainPage";
import TogetherPage from "./pages/Together/TogetherPage";
import MakeRoomPage from "./pages/Together/MakeRoomPage";
import RoomCreatedPage from "./pages/Together/RoomCreatedPage";
import JoinRoomPage from "./pages/Together/JoinRoomPage";
import MyPage from "./pages/MyPage/MyPage";

import PracticePage from "./pages/Practice/PracticePage";
import SoloPracticePage from "./pages/Practice/SoloPracticePage";
import AiPracticePage from "./pages/Practice/AiPracticePage";

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

      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
}
