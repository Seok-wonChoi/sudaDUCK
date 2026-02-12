import styles from "./SimilarExpressions.module.css";

export default function SimilarExpressions({ expressions = [] }) {
  if (expressions.length === 0) return null;

  // 조각들을 문장 단위로 그룹화하는 로직
  const groupedExpressions = expressions.reduce((acc, curr) => {
    // 이전 조각이 존재하고, 그 조각이 문장 부호(. ! ?)로 끝나지 않는다면 이어 붙임
    if (acc.length > 0 && !/[.!?]$/.test(acc[acc.length - 1])) {
      acc[acc.length - 1] = `${acc[acc.length - 1]} ${curr}`;
    } else {
      // 새로운 문장 시작
      acc.push(curr);
    }
    return acc;
  }, []);

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <span className={styles.Icon}>💡</span>
        <span className={styles.Title}>비슷한 표현들</span>
      </div>

      <div className={styles.List}>
        {groupedExpressions.map((expr, index) => (
          <div key={index} className={styles.Item}>
            <div className={styles.English}>{expr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
