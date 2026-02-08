import styles from './BottomAIPlaying.module.css';

export default function BottomAIPlaying() {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.row}>
        <div className={styles.dot} />
        <p className={styles.title}>AI 음성 재생 중...</p>
      </div>

      <p className={styles.sub}>다 들은 후 자동으로 녹음 단계로 넘어가요.</p>
    </div>
  );
}
