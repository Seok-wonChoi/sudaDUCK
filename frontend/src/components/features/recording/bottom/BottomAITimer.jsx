import styles from './BottomAITimer.module.css';

export default function BottomAITimer({ seconds = 3 }) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.iconCircle}>
        <span className={styles.number}>{Math.max(0, seconds)}</span>
      </div>
      <p className={styles.message}>{Math.max(0, seconds)}초 후 AI가 문장을 읽어줍니다</p>
    </div>
  );
}
