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
            {/* 기존: expr.english 
               변경: expr (백엔드에서 문자열 그대로 줌) 
            */}
            <div className={styles.English}>{expr}</div>
            
            {/* 한국어 데이터가 있다면 보여주고, 없으면 숨김 처리 */}
            {expr.korean && <div className={styles.Korean}>{expr.korean}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
