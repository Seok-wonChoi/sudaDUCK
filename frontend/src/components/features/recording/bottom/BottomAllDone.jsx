import styles from './BottomAllDone.module.css';

export default function BottomAllDone({ onRestart, onComplete }) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.iconCircle}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M26.6667 8L12 22.6667L5.33334 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>모든 문장의 녹음이 완료되었습니다!</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button className={styles.restartBtn} onClick={onRestart}>
            다시하기
          </button>
          <button
            className={styles.completeBtn}
            onClick={onComplete}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              background: '#2b7fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            복습게임하기
          </button>
        </div>
      </div>
    </div>
  );
}
