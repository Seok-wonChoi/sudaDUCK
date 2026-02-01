import styles from './BottomRecording.module.css';

export default function BottomRecording() {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.subtitle}>녹음 중...</p>
      <p className={styles.message}>문장을 천천히 또박또박 따라 말해보세요.</p>
    </div>
  );
}
