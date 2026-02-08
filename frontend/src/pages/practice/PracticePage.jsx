import styles from "./PracticePage.module.css";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";

import PracticeHero from "@/components/features/practice/PracticeHero/PracticeHero";
import PracticeModeSelectSection from "@/components/features/practice/PracticeModeSelectSection/PracticeModeSelectSection";

export default function PracticePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/main");
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
            aria-label="?¤ë¡œ ê°€ê¸?
          >
            <span aria-hidden="true">&lt;</span>
          </button>

          <PracticeHero />
          <PracticeModeSelectSection onClickSolo={handleSolo} onClickAi={handleAi} />
        </div>

        <div className={styles.Bottom}>
          <StatsSection
            stats={[
              { value: "0?œê°„", label: "ì´??Œë ˆ???€?? },
              { value: "0??, label: "?°ì† ?™ìŠµ" },
              { value: "0ê°?, label: "?€?¥ëœ ë¬¸ì¥" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
