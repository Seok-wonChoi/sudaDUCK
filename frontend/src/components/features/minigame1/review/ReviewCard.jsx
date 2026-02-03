import styles from './ReviewCard.module.css';
import BlankDetail from './BlankDetail';

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

  return (
    <div className={styles.container}>
      {/* 헤더 - 문제 번호 */}
      <div className={styles.header}>
        <div className={styles.questionNumber}>
          문제 {questionNumber}
        </div>
      </div>

      <div className={styles.card}>
        {/* 한국어 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>한국어</div>
          <div className={styles.korean}>
            {korean}
          </div>
        </div>

        {/* 정답 문장 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>정답 문장</div>
          <div className={styles.english}>
            {english}
          </div>
        </div>

        {/* 빈칸 분석 */}
        <div className={styles.section}>
          <div className={styles.blankHeader}>
            <span className={styles.sectionLabel}>빈칸 분석 ({correctCount}/{totalCount})</span>
          </div>
          <div className={styles.blanks}>
            {blanks.map((blank, idx) => (
              <BlankDetail
                key={idx}
                number={idx + 1}
                answer={blank.answer}
                userAnswer={blank.userAnswer}
                isCorrect={blank.isCorrect}
              />
            ))}
          </div>
        </div>

        {/* 내가 쓴 문장 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>내가 쓴 답</div>
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
    </div>
  );
}
