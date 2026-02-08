import styles from './QuestionInfo.module.css';

export default function QuestionInfo({ current = 1, total = 8, score = 0 }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.badge}>
        문제 {current} / {total}
      </div>
      <div className={styles.score}>?�답: {score}</div>
    </div>
  );
}
