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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <button className={styles.backLink} onClick={onBack}>
          ← 결과로 돌아가기
        </button>
        <h2 className={styles.title}>전체 문제 리뷰</h2>
        <div className={styles.progress}>
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* 문제 카드 */}
      <ReviewCard
        questionNumber={currentIndex + 1}
        korean={currentQuestion.koreanSentence}
        english={currentQuestion.englishSentence}
        blanks={currentQuestion.blanks}
        englishParts={currentQuestion.englishParts}
      />

      {/* 네비게이션 */}
      <div className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${currentIndex === 0 ? styles.disabled : ''}`}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          이전 문제
        </button>
        
        <div className={styles.dots}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`문제 ${idx + 1}로 이동`}
            />
          ))}
        </div>
        
        <button 
          className={`${styles.navButton} ${currentIndex === questions.length - 1 ? styles.disabled : ''}`}
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
        >
          다음 문제
        </button>
      </div>
    </div>
  );
}
