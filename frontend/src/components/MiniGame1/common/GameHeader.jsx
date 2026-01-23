import styles from './GameHeader.module.css';

export default function GameHeader({
  title = '빈칸 채우기',
  timer = '0:00',
  badge = 'MINI 2'
}) {
  return (
    <div className={styles.header}>
      <div className={styles.badge}>{badge}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.timer}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>{timer}</span>
      </div>
    </div>
  );
}
