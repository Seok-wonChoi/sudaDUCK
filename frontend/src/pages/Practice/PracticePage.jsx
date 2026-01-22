import styles from "./PracticePage.module.css";
import { useNavigate } from "react-router-dom";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import TipBanner from "../../components/Main/TipBanner/TipBanner";
import StatsSection from "../../components/Main/StatsSection/StatsSection";

import PracticeHero from "../../components/Practice/PracticeHero/PracticeHero";
import PracticeModeSelectSection from "../../components/Practice/PracticeModeSelectSection/PracticeModeSelectSection";

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
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt; 뒤로가기
          </button>

          <PracticeHero />
          <PracticeModeSelectSection onClickSolo={handleSolo} onClickAi={handleAi} />
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
