import styles from "./PracticeModeSelectSection.module.css";
import ModeCard from "@/components/common/ModeCard/ModeCard";

export default function PracticeModeSelectSection({ onClickSolo, onClickAi }) {
  return (
    <section className={styles.Section} aria-label="?°ìŠµ ëª¨ë“œ ? íƒ">
      <ModeCard
        title="?¼ìž ?°ìŠµ?˜ê¸°"
        description="1ë¶„ê°„ ë¬¸ìž¥???ìœ ë¡?²Œ ?´ì•¼ê¸°í•˜ê¸?
        onClick={onClickSolo}
        variant="solo"
      />

      <ModeCard
        title="AI?€ ?€?”í•˜ê¸?
        description="AIì¹œêµ¬?€ ?€?”í•˜ë©??°ìŠµ?˜ê¸°"
        onClick={onClickAi}
        variant="ai"
      />
    </section>
  );
}
