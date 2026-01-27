import styles from "./SentenceItem.module.css";
import Tag from "../common/Tag";

export default function SentenceItem({ sentence, onClick, onDelete }) {
  const {
    english,
    korean,
    topic,
    score,
    needsReview,
    date,
    bookmarked = true,
  } = sentence;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className={styles.Item} onClick={onClick}>
      <div className={styles.BookmarkIcon}>
        {bookmarked ? (
          <span className={styles.BookmarkFilled}>☑️</span>
        ) : (
          <span className={styles.BookmarkEmpty}>☐</span>
        )}
      </div>

      <div className={styles.Content}>
        <div className={styles.English}>{english}</div>
        <div className={styles.Korean}>{korean}</div>

        <div className={styles.Meta}>
          <div className={styles.Tags}>
            {topic && <Tag variant="topic">{topic}</Tag>}
            {score !== undefined && (
              <Tag variant="score">{score}점</Tag>
            )}
            {needsReview && <Tag variant="review">복습필요</Tag>}
          </div>
          {date && <div className={styles.Date}>{date}</div>}
        </div>
      </div>

      <button
        type="button"
        className={styles.DeleteButton}
        onClick={handleDeleteClick}
        aria-label="삭제"
      >
        🗑️
      </button>
    </div>
  );
}
