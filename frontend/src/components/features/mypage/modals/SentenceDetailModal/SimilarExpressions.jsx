import styles from "./SimilarExpressions.module.css";

export default function SimilarExpressions({ expressions = [] }) {
  if (expressions.length === 0) return null;

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <span className={styles.Icon}>?’¡</span>
        <span className={styles.Title}>ë¹„ìŠ·???œí˜„??/span>
      </div>

      <div className={styles.List}>
        {expressions.map((expr, index) => (
          <div key={index} className={styles.Item}>
            {/* ê¸°ì¡´: expr.english 
               ë³€ê²? expr (ë°±ì—”?œì—??ë¬¸ì??ê·¸ë?ë¡?ì¤? 
            */}
            <div className={styles.English}>{expr}</div>
            
            {/* ?œêµ­???°ì´?°ê? ?ˆë‹¤ë©?ë³´ì—¬ì£¼ê³ , ?†ìœ¼ë©??¨ê? ì²˜ë¦¬ */}
            {expr.korean && <div className={styles.Korean}>{expr.korean}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
