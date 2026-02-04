import styles from './ReviewPanel.module.css';
import ReviewCard from './ReviewCard';

export default function ReviewPanel({ 
  questions = [],
  onBack
}) {
  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          리뷰할 문제가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h2 className={styles.title}>전체 문제 리뷰</h2>
        <p className={styles.subtitle}>
          모든 문제의 정답 풀이를 다시 확인해보세요
        </p>
      </div>

      {/* 문제 카드 리스트 - 세로 스크롤 */}
      <div className={styles.cardList}>
        {questions.map((question, idx) => (
          <div key={idx} className={styles.cardItem}>
            <ReviewCard
              questionNumber={idx + 1}
              korean={question.koreanSentence}
              english={question.englishSentence}
              blanks={question.blanks}
              englishParts={question.englishParts}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
