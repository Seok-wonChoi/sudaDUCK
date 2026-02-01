import styles from './BottomRecording.module.css';

export default function BottomRecording({ onStop }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>녹음 중...</p>

      <div className={styles.row}>
        <p className={styles.sub}>문장을 천천히 또박또박 따라 말해보세요.</p>
        <button className={styles.dangerBtn} onClick={onStop}>
          정지
        </button>
      </div>
    </div>
  );
}
