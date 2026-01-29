import styles from './BottomRecordTimer.module.css';

export default function BottomRecordTimer({ seconds = 3 }) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.iconCircle}>
        <span className={styles.number}>{Math.max(0, seconds)}</span>
      </div>
      <p className={styles.message}>{Math.max(0, seconds)}초 후에 녹음이 시작됩니다</p>
    </div>
  );
}
