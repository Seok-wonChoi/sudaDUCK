import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import duckImg from "../../assets/images/duck.png";
import styles from "./PracticePage.module.css";

export default function PracticePage() {
  const navigate = useNavigate();

  const handleSoloPractice = useCallback(() => {
    navigate("/practice/solo");
  }, [navigate]);

  const handleAiPractice = useCallback(() => {
    navigate("/practice/ai");
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppHeader />

        <main className={styles.content}>
          <header className={styles.titleArea}>
            <h1 className={styles.title}>연습 하기</h1>
            <p className={styles.subtitle}>어떤 모드로 연습할까요? 🙌</p>
          </header>

          <section className={styles.modeGrid} aria-label="연습 모드 선택">
            <button
              type="button"
              className={styles.modeCard}
              onClick={handleSoloPractice}
            >
              <div className={styles.modeIconWrap}>
                <img className={styles.modeIcon} src={duckImg} alt="오리 캐릭터" />
              </div>
              <div className={styles.modeText}>
                <p className={styles.modeTitle}>혼자 연습하기</p>
                <p className={styles.modeDesc}>
                  1분간 같은 문장을 직접 말해보며 연습해요!
                </p>
              </div>
            </button>

            <button
              type="button"
              className={styles.modeCard}
              onClick={handleAiPractice}
            >
              <div className={styles.modeIconWrap}>
                <img className={styles.modeIcon} src={duckImg} alt="오리 캐릭터" />
              </div>
              <div className={styles.modeText}>
                <p className={styles.modeTitle}>AI와 대화하기</p>
                <p className={styles.modeDesc}>
                  AI 친구와 자연스럽게 대화를 이어가요!
                </p>
              </div>
            </button>
          </section>

          <div className={styles.tipWrap} aria-label="안내">
            <div className={styles.tipBox}>
              <span className={styles.tipLabel}>Tip:</span>
              <span className={styles.tipText}>
                연습 모드로 워밍업 후 함께 하기 모드에 도전해보세요!
              </span>
            </div>
          </div>

          <section className={styles.statsGrid} aria-label="연습 통계">
            <div className={styles.statCard}>
              <div className={styles.statValue}>0</div>
              <div className={styles.statLabel}>총 플레이 타임</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statValue}>0일</div>
              <div className={styles.statLabel}>연속 학습</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statValue}>0개</div>
              <div className={styles.statLabel}>저장된 문장</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
