import styles from "./ModeCard.module.css";
import duckHeadsetImg from "@/assets/images/duck_headset.png";
import duckTogetherImg from "@/assets/images/duck_together.png";
import duckSoloImg from "@/assets/images/duck_solo.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";

export default function ModeCard({ title, description, onClick, variant = "practice" }) {
  // 이미지 선택
  let duckSrc;
  switch (variant) {
    case "practice":
      duckSrc = duckHeadsetImg;
      break;
    case "together":
      duckSrc = duckTogetherImg;
      break;
    case "solo":
      duckSrc = duckSoloImg;
      break;
    case "ai":
      duckSrc = duckBotCyanImg;
      break;
    default:
      duckSrc = duckHeadsetImg;
  }

  // 크기 클래스 선택
  const duckClassName = variant === "together"
    ? `${styles.Duck} ${styles.DuckTogether}`
    : styles.Duck;

  return (
    <button className={styles.Card} type="button" onClick={onClick}>
      <div className={styles.ImageWrap} aria-hidden="true">
        <div className={styles.DuckSingle}>
          <img className={duckClassName} src={duckSrc} alt="" draggable="false" />
        </div>
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Description}>{description}</div>
    </button>
  );
}
