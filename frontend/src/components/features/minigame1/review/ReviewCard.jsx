import styles from './ReviewCard.module.css';

export default function ReviewCard({
  questionNumber,
  korean,
  english,
  blanks = [],
  englishParts = []
}) {
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
                <span className={`${styles.blankBox} ${
                  blanks[idx].isCorrect
                    ? styles.correctBlank
                    : styles.wrongBlank
                }`}>
                  {blanks[idx].userAnswer || '_'.repeat(blanks[idx].answer.length)}
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
