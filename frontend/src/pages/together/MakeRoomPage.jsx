import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";

function createInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function MakeRoomPage() {
  const navigate = useNavigate();

  const hotTopics = useMemo(
    () => [
      "첫 아르바이트 추억",
      "최악의 데이트",
      "나만의 취미생활",
      "학창시절 이야기",
      "여행 경험담",
      "좋아하는 음식",
    ],
    []
  );

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [turn, setTurn] = useState(3);

  const titleCount = title.length;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  };

  const handleTitleChange = (e) => {
    const next = e.target.value.slice(0, 30);
    setTitle(next);
  };

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handlePickTopic = (t) => {
    setTopic(t);
  };

  const handleAiRecommend = () => {
    if (hotTopics.length === 0) return;
    const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
    setTopic(next);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("방 제목을 입력해주세요.");
      return;
    }
    if (!topic.trim()) {
      alert("수다 주제를 입력하거나 선택해주세요.");
      return;
    }

    const payload = {
      roomTitle: title.trim(),
      roomTopic: topic.trim(),
      turnCount: turn,
      inviteCode: createInviteCode(),
      isHost: true,
      maxCount: 4,
    };

    sessionStorage.setItem("roomCreateResult", JSON.stringify(payload));
    navigate("/together/waiting", { state: payload });
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff] py-7">
      <div className="max-w-[1120px] mx-auto bg-white rounded-[28px] shadow-[0_18px_50px_rgba(17,24,39,0.1)] overflow-hidden">
        <AppHeader userName="user" notifications={[]} />

        <main className="relative px-4 sm:px-8 py-11 pb-8 bg-white">
          <button
            className="absolute top-3 sm:top-4 left-3 sm:left-4 h-10 px-3 rounded-xl
              border border-indigo-600/20 bg-indigo-600/10 text-indigo-800
              flex items-center gap-2 cursor-pointer font-black text-sm
              hover:border-indigo-600/35 hover:bg-indigo-600/15"
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <span className="text-lg leading-none -translate-y-px" aria-hidden="true">
              &lt;
            </span>
            <span className="text-sm leading-none">뒤로가기</span>
          </button>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-center text-gray-900">
            방 만들기
          </h1>
          <p className="mt-3 text-sm text-center text-gray-500 font-bold">
            친구들과 함께할 수다방을 만들어보세요
          </p>

          <section
            className="max-w-[760px] mx-auto mt-6 border border-gray-200 rounded-2xl bg-white
              shadow-[0_10px_28px_rgba(17,24,39,0.08)] px-4 sm:px-5 py-5 pb-4"
            aria-label="방 만들기 폼"
          >
            {/* 방 제목 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[13px] font-black text-gray-900">방 제목</span>
                <span className="text-[13px] font-black text-red-500">*</span>
              </div>
              <input
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-100/70 px-3.5
                  text-[13px] font-extrabold text-gray-900 outline-none
                  focus:border-indigo-600/45 focus:bg-gray-100/90"
                value={title}
                onChange={handleTitleChange}
                placeholder="예: 친구들과 수다타임"
              />
              <div className="mt-2 text-xs text-gray-400 font-extrabold">{titleCount}/30</div>
            </div>

            {/* 수다 주제 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[13px] font-black text-gray-900">수다 주제</span>
                <span className="text-[13px] font-black text-red-500">*</span>
              </div>

              <div className="grid grid-cols-[1fr_90px] sm:grid-cols-[1fr_96px] gap-2.5">
                <input
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-100/70 px-3.5
                    text-[13px] font-extrabold text-gray-900 outline-none
                    focus:border-indigo-600/45 focus:bg-gray-100/90"
                  value={topic}
                  onChange={handleTopicChange}
                  placeholder="직접 입력하거나 아래에서 선택하세요"
                />
                <button
                  type="button"
                  className="h-11 rounded-xl border-0 cursor-pointer text-white font-black text-[13px]
                    bg-gradient-to-r from-violet-600 via-purple-500 to-orange-500
                    shadow-[0_10px_20px_rgba(124,58,237,0.22)] hover:brightness-[1.02]"
                  onClick={handleAiRecommend}
                >
                  AI 추천
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
                <span className="text-xs font-black text-gray-500">인기 주제</span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {hotTopics.map((t) => {
                  const active = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`rounded-full py-2 px-3.5 text-xs font-black cursor-pointer
                        border transition-colors
                        ${active
                          ? "border-indigo-600/55 bg-indigo-600/10 text-indigo-800"
                          : "border-gray-200 bg-white/90 text-gray-700 hover:border-indigo-600/35"
                        }`}
                      onClick={() => handlePickTopic(t)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 턴 수 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[13px] font-black text-gray-900">턴 수</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[3, 4, 5].map((n) => {
                  const active = turn === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`h-16 rounded-xl border cursor-pointer
                        flex flex-col items-center justify-center gap-1.5
                        ${active
                          ? "border-indigo-600/65 bg-indigo-600/5"
                          : "border-gray-200 bg-white/95 hover:border-indigo-600/30"
                        }`}
                      onClick={() => setTurn(n)}
                    >
                      <span className="text-sm leading-none text-indigo-600/85" aria-hidden="true">
                        ↻
                      </span>
                      <span className="text-[13px] font-black text-gray-900">{n}턴</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="w-full h-11 border-0 rounded-xl cursor-pointer text-white font-black text-sm
                bg-gradient-to-r from-indigo-600 via-violet-600 to-violet-800
                shadow-[0_14px_30px_rgba(79,70,229,0.22)] hover:brightness-[1.02]"
              onClick={handleSubmit}
            >
              방 만들기
            </button>
          </section>

          <div className="max-w-[760px] mx-auto mt-3.5">
            <TipBanner text="Tip: 방을 만들면 참여 코드가 생성되어 친구들에게 공유할 수 있어요!" />
          </div>
        </main>
      </div>
    </div>
  );
}
