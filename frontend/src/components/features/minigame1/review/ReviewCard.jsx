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
    <div className={styles.container}>
      {/* 한국어 문장 */}
      <div className={styles.koreanSection}>
        <div className={styles.label}>한국어 번역</div>
        <div className={styles.koreanText}>{korean}</div>
      </div>

      {/* 정답 문장 */}
      <div className={styles.answerSection}>
        <div className={styles.label}>정답 영어 문장</div>
        <div className={styles.answerSentence}>
          {englishParts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span className={styles.correctWord}>
                  {blanks[idx].answer}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 빈칸 상세 */}
      <div className={styles.blankSection}>
        <div className={styles.label}>빈칸 상세</div>
        {blanks.map((blank, idx) => (
          <div 
            key={idx} 
            className={`${styles.blankDetail} ${blank.isCorrect ? styles.correct : styles.wrong}`}
          >
            <div className={styles.blankHeader}>
              <span className={styles.blankLabel}>
                {blank.isCorrect ? '✓ 정답' : '✗ 오답'}
              </span>
              <span className={styles.blankPosition}>단어 {idx + 1}</span>
            </div>
            <div className={styles.blankContent}>
              <div className={styles.wordRow}>
                <span className={styles.wordLabel}>내 답변</span>
                <span className={styles.userWord}>
                  {blank.userAnswer || '(입력 없음)'}
                </span>
              </div>
              <div className={styles.wordRow}>
                <span className={styles.wordLabel}>정답</span>
                <span className={styles.correctWordLabel}>
                  {blank.answer}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 내가 쓴 답 */}
      <div className={styles.userAnswerSection}>
        <div className={styles.label}>내가 쓴 답</div>
        <div className={styles.userSentence}>
          {englishParts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span 
                  className={`${styles.userBlank} ${
                    blanks[idx].isCorrect ? styles.correctBlank : styles.wrongBlank
                  }`}
                >
                  {blanks[idx].userAnswer || '(입력 없음)'}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
