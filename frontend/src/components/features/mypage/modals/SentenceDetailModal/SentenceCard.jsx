import styles from "./SentenceCard.module.css";

export default function SentenceCard({ english, korean, onPlayAudio }) {
  return (
    <div className={styles.Card}>
      <div className={styles.Label}>영어 문장</div>
      <div className={styles.English}>{english}</div>

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
