import styles from "./SentenceCard.module.css";

export default function SentenceCard({ english, korean, blankWords = [], ttsUrl }) {
  // 오디오 재생 핸들러
  const handlePlayAudio = () => {
    if (!ttsUrl) {
      alert("재생할 오디오 파일이 없습니다.");
      return;
    }

    // URL이 http로 시작하면 그대로 쓰고, 아니면 백엔드 주소 붙이기
    const audioSrc = ttsUrl.startsWith("http") 
      ? ttsUrl 
      : `${BACKEND_URL}${ttsUrl}`;

    const audio = new Audio(audioSrc);
    audio.play().catch((err) => {
      console.error("오디오 재생 실패:", err);
      alert("오디오 재생에 실패했습니다.");
    });
  };

  
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
        onClick={handlePlayAudio}
        data-click-sound="false"
      >
        <span className={styles.SpeakerIcon}>🔊</span>
        영어로 듣기
      </button>
    </div>
  );
}
