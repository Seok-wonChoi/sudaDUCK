import styles from "./MainPage.module.css";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/Layout/AppHeader/AppHeader";
import MainHero from "@/components/features/main/MainHero/MainHero";
import ModeSelectSection from "@/components/features/main/ModeSelectSection/ModeSelectSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";

export default function MainPage() {
  const navigate = useNavigate();

  const handlePractice = () => {
    navigate("/practice");
  };

  const handleTogether = () => {
    navigate("/together");
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <MainHero />
          <ModeSelectSection
            onClickPractice={handlePractice}
            onClickTogether={handleTogether}
          />
        </div>

        <div className={styles.Bottom}>
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
