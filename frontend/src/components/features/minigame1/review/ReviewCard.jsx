import styles from './ReviewCard.module.css';
import BlankDetail from './BlankDetail';

export default function ReviewCard({
  questionNumber,
  correctCount,
  totalBlanks,
  koreanSentence,
  englishParts,
  blanks
}) {
  const isAllCorrect = correctCount === totalBlanks;

  return (
    <div className={`${styles.card} ${isAllCorrect ? styles.correct : styles.wrong}`}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${isAllCorrect ? styles.badgeCorrect : styles.badgeWrong}`}>
          {isAllCorrect ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {correctCount}/{totalBlanks} 정답
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {correctCount}/{totalBlanks} 오답
            </>
          )}
        </span>
        <span className={styles.questionNum}>문제 #{questionNumber}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>한국어 의미</span>
        <p className={styles.koreanText}>{koreanSentence}</p>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>완성된 영어 문장</span>
        <div className={styles.englishSentence}>
          {englishParts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span className={`${styles.blankWord} ${blanks[idx].isCorrect ? styles.blankCorrect : styles.blankWrong}`}>
                  {blanks[idx].answer}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>빈칸 상세</span>
        {blanks.map((blank, idx) => (
          <BlankDetail
            key={idx}
            isCorrect={blank.isCorrect}
            answer={blank.answer}
            userAnswer={blank.userAnswer}
          />
        ))}
      </div>
    </div>
  );
}
