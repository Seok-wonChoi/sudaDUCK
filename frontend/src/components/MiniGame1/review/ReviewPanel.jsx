import styles from './ReviewPanel.module.css';
import ReviewCard from './ReviewCard';

export default function ReviewPanel({ questions = [], onComplete }) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>전체 문제 리뷰</h2>
        <p className={styles.subtitle}>맞춘 문제와 틀린 문제를 모두 확인해보세요</p>
      </div>

      <div className={styles.list}>
        {questions.map((q, idx) => (
          <ReviewCard
            key={idx}
            questionNumber={idx + 1}
            correctCount={q.correctCount}
            totalBlanks={q.totalBlanks}
            koreanSentence={q.koreanSentence}
            englishParts={q.englishParts}
            blanks={q.blanks}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <button className={styles.completeBtn} onClick={onComplete}>
          완료
        </button>
      </div>
    </div>
  );
}
