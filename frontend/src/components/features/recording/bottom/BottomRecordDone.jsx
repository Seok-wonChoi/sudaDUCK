import styles from './BottomRecordDone.module.css';

export default function BottomRecordDone({ onNext, isLast = false }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>✅ 문장 녹음 완료!</p>
      <p className={styles.sub}>
        {isLast ? '마지막 문장까지 완료했어요.' : '다음 문장으로 넘어갈까요?'}
      </p>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={onNext}>
          {isLast ? '완료 화면으로' : '다음 문장'}
        </button>
      </div>
    </div>
  );
}
