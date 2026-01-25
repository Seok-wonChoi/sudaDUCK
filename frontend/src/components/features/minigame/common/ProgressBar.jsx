import styles from './ProgressBar.module.css';

export default function ProgressBar({ current = 0, total = 100 }) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
