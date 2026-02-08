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
    ttsUrl
  } = sentence;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  // ?êÏàò???∞Î•∏ variant Í≤∞Ï†ï
  const getScoreVariant = (scoreValue) => {
    if (scoreValue < 40) return 'scoreRed';
    if (scoreValue < 60) return 'scoreOrange';
    if (scoreValue < 80) return 'scoreYellow';
    return 'scoreGreen';
  };

  return (
    <div className={styles.Item} onClick={onClick}>
      <div className={styles.BookmarkIcon}>
        {bookmarked ? (
          <span className={styles.BookmarkFilled}>?ëÔ∏è</span>
        ) : (
          <span className={styles.BookmarkEmpty}>??/span>
        )}
      </div>

      <div className={styles.Content}>
        <div className={styles.English}>{english}</div>
        <div className={styles.Korean}>{korean}</div>

        <div className={styles.Meta}>
          <div className={styles.Tags}>
            {topic && <Tag variant="topic">{topic}</Tag>}
            {score !== undefined && (
              <Tag variant={getScoreVariant(score)}>{score}??/Tag>
            )}
            {needsReview && <Tag variant="review">Î≥µÏäµ?ÑÏöî</Tag>}
          </div>
          {date && <div className={styles.Date}>{date}</div>}
        </div>
      </div>

      <button
        type="button"
        className={styles.DeleteButton}
        onClick={handleDeleteClick}
        aria-label="??†ú"
      >
        ?óëÔ∏?
      </button>
    </div>
  );
}
