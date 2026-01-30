import styles from "./PracticeModeSelectSection.module.css";
import ModeCard from "@/components/common/ModeCard/ModeCard";

export default function PracticeModeSelectSection({ onClickSolo, onClickAi }) {
  return (
    <section className={styles.Section} aria-label="연습 모드 선택">
      <ModeCard
        title="혼자 연습하기"
        description="1분간 문장을 자유롭게 이야기하기"
        onClick={onClickSolo}
        duckCount={1}
      />

      <ModeCard
        title="AI와 대화하기"
        description="AI친구와 대화하며 연습하기"
        onClick={onClickAi}
        duckCount={1}
      />
    </section>
  );
}
