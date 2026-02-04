import styles from "./ModeSelectSection.module.css";
import ModeCard from "@/components/common/ModeCard/ModeCard";

export default function ModeSelectSection({ onClickPractice, onClickTogether }) {
  const practiceDisabled = true;

  return (
    <section className={styles.Section} aria-label="학습 모드 선택">
      <ModeCard
        title="연습 모드"
        description="편하게 연습하고 실력을 쌓아보세요"
        onClick={onClickPractice}
        variant="practice"
        disabled={practiceDisabled}
        disabledMessage="아직 오픈 예정입니다 👀"
      />

      <ModeCard
        title="함께하기"
        description="친구들과 함께 수다 떨며 영어 공부하기"
        onClick={onClickTogether}
        variant="together"
      />
    </section>
  );
}
