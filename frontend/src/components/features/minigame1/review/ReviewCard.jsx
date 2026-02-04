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
                <span className={styles.blankBox}>
                  {blanks[idx].answer}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 빈칸 상세 */}
      <div className={styles.section}>
        <div className={styles.label}>빈칸 상세</div>
        <div className={styles.blankList}>
          {blanks.map((blank, idx) => (
            <div key={idx} className={styles.blankItem}>
              <div className={`${styles.blankBadge} ${blank.isCorrect ? styles.correctBadge : styles.wrongBadge}`}>
                {blank.isCorrect ? '✓ 정답' : '✗ 오답'}
              </div>
              <div className={styles.blankContent}>
                {blank.isCorrect ? (
                  // 정답일 때는 답만 표시 (레이블 없음)
                  <div className={styles.answerOnly}>
                    {blank.answer}
                  </div>
                ) : (
                  // 오답일 때는 "내 답변"과 "정답" 표시
                  <>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>내 답변</span>
                      <span className={styles.wrongAnswer}>
                        {blank.userAnswer ? blank.userAnswer : '(입력하지 않음)'}
                      </span>
                    </div>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>정답</span>
                      <span className={styles.correctAnswer}>
                        {blank.answer}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
