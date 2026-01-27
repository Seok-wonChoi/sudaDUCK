import styles from './BottomIdle.module.css';

export default function BottomIdle({ onStart, onNext }) {
  const handleStart = onStart || onNext;

  return (
    <div className={styles.container}>
      <div className={styles.statusMessage}>
        <p className={styles.messageText}>녹음 대기 중...</p>
        <p className={styles.subText}>시작을 누르면 AI가 문장을 읽어줘요.</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={handleStart}>
          시작
        </button>
      </div>
    </div>
  );
}
