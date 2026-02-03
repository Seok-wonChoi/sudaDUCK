import { useState } from 'react';
import styles from './ReviewPanel.module.css';
import ReviewCard from './ReviewCard';

export default function ReviewPanel({ 
  questions = [],
  onBack
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          리뷰할 문제가 없습니다.
        </div>
        <button className={styles.backButton} onClick={onBack}>
          결과로 돌아가기
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h2 className={styles.title}>전체 문제 리뷰</h2>
        <p className={styles.subtitle}>
          모든 문제의 정답 풀이를 다시 확인해보세요
        </p>
        <button className={styles.backLink} onClick={onBack}>
          결과로 돌아가기
        </button>
      </div>

      {/* 문제 카드 */}
      <div className={styles.cardWrapper}>
        <ReviewCard
          questionNumber={currentIndex + 1}
          korean={currentQuestion.koreanSentence}
          english={currentQuestion.englishSentence}
          blanks={currentQuestion.blanks}
          englishParts={currentQuestion.englishParts}
        />
      </div>

      {/* 하단 네비게이션 */}
      <div className={styles.navigation}>
        {/* 점 인디케이터 */}
        <div className={styles.dots}>
          {questions.map((_, idx) => {
            // 정답 여부 확인
            const question = questions[idx];
            const allCorrect = question.blanks.every(b => b.isCorrect);
            const hasWrong = question.blanks.some(b => !b.isCorrect);
            
            return (
              <button
                key={idx}
                className={`${styles.dot} ${
                  idx === currentIndex ? styles.activeDot : ''
                } ${allCorrect ? styles.correctDot : hasWrong ? styles.wrongDot : ''}`}
                onClick={() => handleDotClick(idx)}
                aria-label={`문제 ${idx + 1}로 이동`}
              >
                <span className={styles.dotInner} />
              </button>
            );
          })}
        </div>

        {/* 완료 버튼 */}
        <button className={styles.completeButton} onClick={onBack}>
          완료
        </button>
      </div>
    </div>
  );
}
