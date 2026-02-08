import styles from './ReviewCard.module.css';

export default function ReviewCard({
  questionNumber,
  korean,
  blanks = [],
  englishParts = []
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.qNum}>문제 #{questionNumber}</span>
        <div className={styles.stats}>
          {blanks.filter(b => b.isCorrect).length} / {blanks.length} 맞힘
        </div>
      </div>

      <div className={styles.korean}>{korean}</div>

      <div className={styles.sentence}>
        {englishParts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < blanks.length && (
              <span className={styles.blankWrapper}>
                <span 
                  className={`${styles.userAnswer} ${blanks[idx].isCorrect ? styles.correct : styles.wrong}`}
                  style={{ minWidth: `${(blanks[idx].answer?.length || 4) * 2.5 + 4}ch`, textAlign: 'center' }}
                >
                  {blanks[idx].userAnswer || '(미입??'}
                </span>
                {!blanks[idx].isCorrect && (
                  <span 
                    className={styles.correctAnswer}
                    style={{ minWidth: `${(blanks[idx].answer?.length || 4) * 2.5 + 4}ch`, textAlign: 'center' }}
                  >
                    {blanks[idx].answer}
                  </span>
                )}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
