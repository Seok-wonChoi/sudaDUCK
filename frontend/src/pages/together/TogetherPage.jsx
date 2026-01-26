import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ActionCard from "@/components/common/ActionCard/ActionCard";

import makeRoomIcon from "@/assets/icons/make_room.png";
import joinRoomIcon from "@/assets/icons/join_room.png";

export default function TogetherPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleMakeRoom = () => {
    navigate("/together/make");
  };

  const handleJoinRoom = () => {
    navigate("/together/join");
  };

  const topics = [
    "첫 아르바이트 추억",
    "최악의 데이트",
    "나만의 취미생활",
    "학창시절 이야기",
    "여행 경험담",
  ];

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <AppHeader userName="user" notifications={[]} />

        <main className="py-6">
          <button
            className="mb-4 py-2 px-4 border-none bg-transparent text-gray-500
              text-sm font-semibold cursor-pointer hover:text-gray-900 flex items-center gap-1"
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <span aria-hidden="true">&lt;</span>
            <span>뒤로가기</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 text-center m-0 mb-2">함께 하기</h1>
          <p className="text-sm text-gray-500 text-center m-0 mb-6">새로운 방을 만들거나 친구의 방에 참여해보세요</p>

          <section className="flex flex-wrap justify-center gap-6" aria-label="함께하기 메뉴">
            <ActionCard
              title="방 만들기"
              description="새로운 방을 만들고 친구들을 초대하세요."
              iconSrc={makeRoomIcon}
              iconAlt="방 만들기"
              onClick={handleMakeRoom}
            />
            <ActionCard
              title="참여하기"
              description="친구가 공유한 참여 코드로 방에 입장하세요."
              iconSrc={joinRoomIcon}
              iconAlt="참여하기"
              onClick={handleJoinRoom}
            />
          </section>
        </main>

        <section className="py-6" aria-label="공유 및 인기 주제">
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl py-4 px-6 text-center mb-6">
            <span className="text-sm font-semibold text-gray-700">
              친구에게 참여 코드를 <span className="text-amber-600 font-bold">카톡</span>으로 공유하세요!
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-bold text-gray-900 mb-3">지금 인기있는 주제</div>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="py-2 px-4 border border-gray-200 rounded-full bg-white
                    text-sm font-medium text-gray-700 cursor-pointer
                    hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
