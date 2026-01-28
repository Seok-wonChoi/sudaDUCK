import styles from "./ModeCard.module.css";
import duckHeadsetImg from "@/assets/images/duck_headset.png";
import duckTogetherImg from "@/assets/images/duck_together.png";

export default function ModeCard({ title, description, onClick, variant = "practice" }) {
  const isPractice = variant === "practice";
  const duckSrc = isPractice ? duckHeadsetImg : duckTogetherImg;

  return (
    <button className={styles.Card} type="button" onClick={onClick}>
      <div className={styles.ImageWrap} aria-hidden="true">
        <div className={styles.DuckSingle}>
          <img className={styles.Duck} src={duckSrc} alt="" draggable="false" />
        </div>
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Description}>{description}</div>
    </button>
  );
}
