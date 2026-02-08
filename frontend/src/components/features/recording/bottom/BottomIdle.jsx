import styles from './BottomIdle.module.css';

export default function BottomIdle({ onStart, onNext }) {
  const handleStart = onStart || onNext;

  return (
    <div className={styles.container} aria-live="polite">
      <button
        className={styles.iconCircle}
        onClick={handleStart}
        aria-label="?¹ìŒ ?œìž‘"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M10 8L22 16L10 24V8Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <p className={styles.message}>?œìž‘ ?„ì´ì½˜ì„ ?´ë¦­?˜ì—¬ ?¹ìŒ???œìž‘?˜ì„¸??/p>
    </div>
  );
}
