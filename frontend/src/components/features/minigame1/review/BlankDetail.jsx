import styles from './BlankDetail.module.css';

export default function BlankDetail({ isCorrect, answer, userAnswer }) {
  if (isCorrect) {
    return (
      <div className={`${styles.detail} ${styles.correct}`}>
        <span className={styles.badge}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          정답
        </span>
        <span className={styles.answer}>{answer}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.detail} ${styles.wrong}`}>
      <span className={styles.badge}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        오답
      </span>
      <div className={styles.comparison}>
        <div className={styles.userAnswer}>
          <span className={styles.label}>내 답변</span>
          <span className={styles.value}>{userAnswer || '(입력하지 않음)'}</span>
        </div>
        <div className={styles.correctAnswer}>
          <span className={styles.label}>정답</span>
          <span className={styles.value}>{answer}</span>
        </div>
      </div>
    </div>
  );
}
