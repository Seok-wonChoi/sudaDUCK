import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";

import PracticeHero from "@/components/features/practice/PracticeHero/PracticeHero";
import PracticeModeSelectSection from "@/components/features/practice/PracticeModeSelectSection/PracticeModeSelectSection";

export default function PracticePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleSolo = () => {
    navigate("/practice/solo");
  };

  const handleAi = () => {
    navigate("/practice/ai");
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <AppHeader userName="user" notifications={[]} />

        <div className="py-6">
          <button
            className="mb-4 py-2 px-4 border-none bg-transparent text-gray-500
              text-sm font-semibold cursor-pointer hover:text-gray-900"
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt; 뒤로가기
          </button>

          <PracticeHero />
          <PracticeModeSelectSection onClickSolo={handleSolo} onClickAi={handleAi} />
        </div>

        <div className="py-6">
          <TipBanner text="Tip: 연습 모드로 워밍업 후 함께 하기 모드에 도전해보세요!" />
          <StatsSection
            stats={[
              { value: "0", label: "총 플레이 타임" },
              { value: "0일", label: "연속 학습" },
              { value: "0개", label: "저장된 문장" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
