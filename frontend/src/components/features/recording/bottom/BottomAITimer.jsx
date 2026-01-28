import styles from './BottomAITimer.module.css';

export default function BottomAITimer({ seconds = 3 }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>AI가 문장을 읽기까지</p>
      <div className={styles.counter}>{Math.max(0, seconds)}</div>
      <p className={styles.sub}>잠시 후 AI 음성이 재생돼요</p>
    </div>
  );
}
