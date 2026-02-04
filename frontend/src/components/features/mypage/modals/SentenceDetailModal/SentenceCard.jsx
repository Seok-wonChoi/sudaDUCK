import styles from "./SentenceCard.module.css";

export default function SentenceCard({ english, korean, blankWords = [], onPlayAudio }) {
  // 빈칸 단어를 강조 표시하는 함수
  const getDisplayEnglish = () => {
    if (!blankWords || blankWords.length === 0) {
      return <>{english}</>;
    }

    let parts = [english];
    blankWords.forEach((word) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const regex = new RegExp(`\\b(${word})\\b`, 'gi');
          const splits = part.split(regex);

          splits.forEach((split, idx) => {
            if (split.toLowerCase() === word.toLowerCase()) {
              newParts.push(
                <span key={`blank-${word}-${idx}`} className={styles.blankHighlight}>
                  {split}
                </span>
              );
            } else if (split) {
              newParts.push(split);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return <>{parts}</>;
  };

  return (
    <div className={styles.Card}>
      <div className={styles.Label}>
        영어 문장
        {blankWords && blankWords.length > 0 && (
          <span className={styles.blankInfo}> (강조된 부분은 쉐도잉 시 빈칸이었던 단어입니다)</span>
        )}
      </div>
      <div className={styles.English}>{getDisplayEnglish()}</div>

      <div className={styles.Label}>한글 해석</div>
      <div className={styles.Korean}>{korean}</div>

      <button
        type="button"
        className={styles.PlayButton}
        onClick={onPlayAudio}
      >
        <span className={styles.SpeakerIcon}>🔊</span>
        영어로 듣기
      </button>
    </div>
  );
}
