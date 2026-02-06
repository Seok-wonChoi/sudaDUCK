import { useState } from 'react';
import styles from './ReviewCard.module.css';

export default function ReviewCard({
  questionNumber,
  korean,
  english,
  blanks = [],
  englishParts = []
}) {
  // 각 blank의 토글 상태 (false = 틀린 답변 표시, true = 정답 표시)
  const [showingCorrect, setShowingCorrect] = useState(
    blanks.map(() => false)
  );

  // 틀린 답변을 클릭하면 정답 ↔ 틀린 답변 토글
  const handleBlankClick = (idx) => {
    // 원래 맞힌 경우는 토글 불가
    if (blanks[idx].isCorrect) return;

    setShowingCorrect(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // 정답 개수 계산
  const correctCount = blanks.filter(b => b.isCorrect).length;
  const totalCount = blanks.length;
  const isAllCorrect = correctCount === totalCount;

  return (
    <div className={`${styles.card} ${isAllCorrect ? styles.correctCard : styles.wrongCard}`}>
      {/* 상단: 정답 배지 + 문제 번호 */}
      <div className={styles.header}>
        <div className={`${styles.badge} ${isAllCorrect ? styles.correctBadge : styles.wrongBadge}`}>
          {isAllCorrect ? '✓' : '✗'} {correctCount}/{totalCount} 정답
        </div>
        <div className={styles.questionNum}>문제 #{questionNumber}</div>
      </div>

      {/* 한국어 의미 */}
      <div className={styles.section}>
        <div className={styles.label}>한국어 의미</div>
        <div className={styles.koreanText}>{korean}</div>
      </div>

      {/* 완성된 영어 문장 */}
      <div className={styles.section}>
        <div className={styles.label}>완성된 영어 문장</div>
        <div className={styles.completedSentence}>
          {englishParts.map((part, idx) => (
            <span key={idx} className={styles.sentencePart}>
              {part}
              {idx < blanks.length && (
                <span
                  className={`${styles.blankBox} ${
                    // 원래 맞힌 경우 또는 토글해서 정답 보는 중이면 파란색
                    (blanks[idx].isCorrect || showingCorrect[idx])
                      ? styles.correctBlank
                      : styles.wrongBlank
                  } ${!blanks[idx].userAnswer ? styles.emptyBlank : ''}
                  ${!blanks[idx].isCorrect ? styles.clickable : ''}`}
                  onClick={() => handleBlankClick(idx)}
                >
                  {/* 원래 맞힌 경우 → userAnswer 표시 */}
                  {/* 틀렸는데 토글해서 정답 보는 중 → answer 표시 */}
                  {/* 틀렸고 토글 안함 → userAnswer 표시 */}
                  {blanks[idx].isCorrect
                    ? blanks[idx].userAnswer
                    : showingCorrect[idx]
                    ? blanks[idx].answer
                    : (blanks[idx].userAnswer || blanks[idx].answer)}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 틀린 단어 */}
      {blanks.some(b => !b.isCorrect) && (
        <div className={styles.section}>
          <div className={styles.label}>틀린 단어</div>
          <div className={styles.wrongWordsList}>
            {blanks
              .filter(blank => !blank.isCorrect)
              .map((blank, idx) => (
                <div key={idx} className={styles.wrongWordItem}>
                  <span className={styles.wrongUserAnswer}>
                    {blank.userAnswer || '(입력하지 않음)'}
                  </span>
                  <span className={styles.arrow}> → </span>
                  <span className={styles.correctAnswerText}>
                    {blank.answer}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
