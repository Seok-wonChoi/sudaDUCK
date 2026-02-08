import styles from './BottomAllDone.module.css';

export default function BottomAllDone({ onRestart, onComplete, isHost }) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.iconCircle}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M26.6667 8L12 22.6667L5.33334 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>모든 문장???�음???�료?�었?�니??</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button className={styles.restartBtn} onClick={onRestart}>
            ?�시?�기
          </button>
          <button
            className={styles.completeBtn}
            onClick={onComplete}
            disabled={!isHost}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              background: isHost ? '#2b7fff' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: isHost ? 'pointer' : 'not-allowed',
              opacity: isHost ? 1 : 0.6
            }}
          >
            {isHost ? '모두 복습게임 ?�작' : '방장???�작???�까지 ?��?}
          </button>
        </div>
      </div>
    </div>
  );
}
