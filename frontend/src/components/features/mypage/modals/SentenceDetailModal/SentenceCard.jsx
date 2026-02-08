import styles from "./SentenceCard.module.css";

export default function SentenceCard({ english, korean, blankWords = [], ttsUrl }) {
  // ?¤ë””???¬ìƒ ?¸ë“¤??
  const handlePlayAudio = () => {
    if (!ttsUrl) {
      alert("?¬ìƒ???¤ë””???Œì¼???†ìŠµ?ˆë‹¤.");
      return;
    }

    // URL??httpë¡??œì‘?˜ë©´ ê·¸ë?ë¡??°ê³ , ?„ë‹ˆë©?ë°±ì—”??ì£¼ì†Œ ë¶™ì´ê¸?
    const audioSrc = ttsUrl.startsWith("http") 
      ? ttsUrl 
      : `${BACKEND_URL}${ttsUrl}`;

    const audio = new Audio(audioSrc);
    audio.play().catch((err) => {
      console.error("?¤ë””???¬ìƒ ?¤íŒ¨:", err);
      alert("?¤ë””???¬ìƒ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    });
  };

  
  // ë¹ˆì¹¸ ?¨ì–´ë¥?ê°•ì¡° ?œì‹œ?˜ëŠ” ?¨ìˆ˜
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
        ?ì–´ ë¬¸ì¥
        {blankWords && blankWords.length > 0 && (
          <span className={styles.blankInfo}> (ê°•ì¡°??ë¶€ë¶„ì? ?ë„????ë¹ˆì¹¸?´ì—ˆ???¨ì–´?…ë‹ˆ??</span>
        )}
      </div>
      <div className={styles.English}>{getDisplayEnglish()}</div>

      <div className={styles.Label}>?œê? ?´ì„</div>
      <div className={styles.Korean}>{korean}</div>

      <button
        type="button"
        className={styles.PlayButton}
        onClick={handlePlayAudio}
        data-click-sound="false"
      >
        <span className={styles.SpeakerIcon}>?”Š</span>
        ?ì–´ë¡??£ê¸°
      </button>
    </div>
  );
}
