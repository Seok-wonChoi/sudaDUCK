import styles from './BlankFillSentence.module.css';

export default function BlankFillSentence({ parts = [], blanks = [] }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span className={styles.labelBlue}>English</span>
        <span className={styles.labelGray}> - 빈칸 채우기</span>
      </div>
      <div className={styles.card}>
        <div className={styles.sentence}>
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span
                  className={`${styles.blank} ${
                    blanks[idx].status === 'correct'
                      ? styles.correct
                      : blanks[idx].status === 'wrong'
                      ? styles.wrong
                      : styles.empty
                  }`}
                >
                  {blanks[idx].value || ''}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
