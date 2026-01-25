import styles from './BottomAllDone.module.css';

export default function BottomAllDone({ onRestart }) {
  return (
    <div className={styles.container} aria-live="polite">
      <p className={styles.title}>🎉 전체 문장 녹음 완료!</p>
      <p className={styles.sub}>수고했어요. 다시 연습하거나 결과 페이지로 이동할 수 있어요.</p>

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onRestart}>
          다시하기
        </button>
      </div>
    </div>
  );
}
