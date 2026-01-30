import styles from "./SimilarExpressions.module.css";

export default function SimilarExpressions({ expressions = [] }) {
  if (expressions.length === 0) return null;

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <span className={styles.Icon}>💡</span>
        <span className={styles.Title}>비슷한 표현들</span>
      </div>

      <div className={styles.List}>
        {expressions.map((expr, index) => (
          <div key={index} className={styles.Item}>
            <div className={styles.English}>{expr.english}</div>
            <div className={styles.Korean}>{expr.korean}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
