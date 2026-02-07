import styles from './ReviewPanel.module.css';
import ReviewCard from './ReviewCard';

export default function ReviewPanel({ 
  questions = [],
  onBack
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={onBack}>
          &larr; 결과로 돌아가기
        </button>
      </div>
      
      <div className={styles.header}>
        <h2 className={styles.title}>전체 문제 리뷰</h2>
        <p className={styles.subtitle}>틀린 부분과 정답을 확인해보세요</p>
      </div>

      <div className={styles.cardList}>
        {questions.map((question, idx) => (
          <ReviewCard
            key={idx}
            questionNumber={idx + 1}
            korean={question.koreanSentence}
            blanks={question.blanks}
            englishParts={question.englishParts}
          />
        ))}
      </div>
    </div>
  );
}