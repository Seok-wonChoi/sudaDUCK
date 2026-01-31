import styles from './BottomRecordDone.module.css';

export default function BottomRecordDone({ isLast = false }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>✅ 문장 녹음 완료!</p>
      <p className={styles.sub}>
        {isLast ? '완료 화면으로...' : '다음 문장으로...'}
      </p>
    </div>
  );
}
