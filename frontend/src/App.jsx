import { Routes, Route } from "react-router-dom";

import MainPage from "./pages/Main/MainPage";
import TogetherPage from "./pages/Together/TogetherPage";
import JoinRoomPage from "./pages/Together/JoinRoomPage";
import MakeRoomPage from "./pages/Together/MakeRoomPage";
import RoomCreatedPage from "./pages/Together/RoomCreatedPage";
import MyPage from "./pages/MyPage/MyPage";
import RecordingPage from "./pages/Recording";

import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/together" element={<TogetherPage />} />
        <Route path="/together/join" element={<JoinRoomPage />} />
        <Route path="/together/make" element={<MakeRoomPage />} />
        <Route path="/together/created" element={<RoomCreatedPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/recording" element={<RecordingPage />} />
      </Routes>
    </div>
  );
}

