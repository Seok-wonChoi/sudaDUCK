import styles from "./ModeCard.module.css";
import duckImg from "@/assets/images/duck.png";

export default function ModeCard({ title, description, onClick, duckCount = 1 }) {
  const isDouble = duckCount === 2;

  return (
    <button className={styles.Card} type="button" onClick={onClick}>
      <div className={styles.ImageWrap} aria-hidden="true">
        {isDouble ? (
          <div className={styles.DuckRow}>
            <img className={styles.Duck} src={duckImg} alt="" draggable="false" />
            <img className={styles.Duck} src={duckImg} alt="" draggable="false" />
          </div>
        ) : (
          <div className={styles.DuckSingle}>
            <img className={styles.Duck} src={duckImg} alt="" draggable="false" />
          </div>
        )}

        {/* ✅ 2마리(함께하기)일 때만 위치 조정용 클래스 적용 */}
        <div className={`${styles.Sparkles} ${isDouble ? styles.Double : ""}`}>
          ✨
        </div>
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Description}>{description}</div>
    </button>
  );
}
