import styles from './ParticipantList.module.css';

export default function ParticipantList({ participants = [] }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#facc15"/>
        </svg>
        <span>참여자</span>
      </div>
      <div className={styles.list}>
        {participants.map((p, idx) => (
          <div key={idx} className={styles.participant}>
            <div className={`${styles.avatar} ${p.isActive ? styles.active : styles.inactive}`}>
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} />
              ) : (
                <div className={styles.avatarPlaceholder} />
              )}
              <div className={`${styles.micIcon} ${p.isActive ? styles.micActive : styles.micInactive}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1V6M5 6C3.89543 6 3 5.10457 3 4M5 6C6.10457 6 7 5.10457 7 4M2 4V5C2 6.65685 3.34315 8 5 8C6.65685 8 8 6.65685 8 5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <span className={styles.name}>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
