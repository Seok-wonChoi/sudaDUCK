import { useState } from "react";
import styles from "./ModeCard.module.css";
import duckHeadsetImg from "@/assets/images/duck_headset.png";
import duckTogetherImg from "@/assets/images/duck_together2.png";
import duckSoloImg from "@/assets/images/duck_solo.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";

export default function ModeCard({
  title,
  description,
  onClick,
  variant = "practice",
  disabled = false,
  disabledMessage = "오픈 예정입니다",
}) {
  const [hovered, setHovered] = useState(false);

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

  const duckClassName =
    variant === "together"
      ? `${styles.Duck} ${styles.DuckTogether}`
      : styles.Duck;

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <div
      className={styles.CardWrap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className={`${styles.Card} ${disabled ? styles.Disabled : ""}`}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
      >
        <div className={styles.ImageWrap} aria-hidden="true">
          <div className={styles.DuckSingle}>
            <img className={duckClassName} src={duckSrc} alt="" draggable="false" />
          </div>

          {/* 회색 오버레이 + 배지 */}
          {disabled && (
            <>
              <div className={styles.Overlay} aria-hidden="true" />
              <div className={styles.Badge}>오픈 예정</div>
            </>
          )}
        </div>

        <div className={styles.Title}>{title}</div>
        <div className={styles.Description}>{description}</div>
      </button>

      {/* hover 툴팁 */}
      {disabled && hovered && (
        <div className={styles.Tooltip} role="status" aria-live="polite">
          {disabledMessage}
        </div>
      )}
    </div>
  );
}
