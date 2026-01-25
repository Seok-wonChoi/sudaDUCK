import styles from "./SentenceList.module.css";
import SentenceItem from "./SentenceItem";

export default function SentenceList({ sentences = [], onItemClick, onDelete }) {
  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <span className={styles.Icon}>🔖</span>
        <h2 className={styles.Title}>저장한 영어 문장</h2>
      </div>

      <div className={styles.List}>
        {sentences.length === 0 ? (
          <div className={styles.Empty}>저장된 문장이 없습니다.</div>
        ) : (
          sentences.map((sentence) => (
            <SentenceItem
              key={sentence.id}
              sentence={sentence}
              onClick={() => onItemClick?.(sentence)}
              onDelete={() => onDelete?.(sentence.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
