import styles from './BottomRecordTimer.module.css';

export default function BottomRecordTimer({ seconds = 3 }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>녹음 시작까지</p>
      <div className={styles.counter}>{Math.max(0, seconds)}</div>
      <p className={styles.sub}>카운트가 끝나면 녹음이 시작돼요</p>
    </div>
  );
}
