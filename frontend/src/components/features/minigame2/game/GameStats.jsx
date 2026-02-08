import styles from './GameStats.module.css';

export default function GameStats({ current = 0, total = 10, timeLeft = 0 }) {
  return (
    <div className={styles.stats}>
      <div className={styles.badge}>
        <span>{current} / {total}</span>
      </div>
      <div className={styles.badge}>
        <span>{timeLeft}ì´?/span>
      </div>
    </div>
  );
}
