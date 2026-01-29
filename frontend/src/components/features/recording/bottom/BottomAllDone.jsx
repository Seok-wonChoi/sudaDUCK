import styles from './BottomAllDone.module.css';

export default function BottomAllDone({ onRestart }) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.iconCircle}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M26.6667 8L12 22.6667L5.33334 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>완료 모든 문장의 녹음이 완료되었습니다</p>
        <button className={styles.restartBtn} onClick={onRestart}>
          다시하기
        </button>
      </div>
    </div>
  );
}
