import { useState } from "react";
import styles from "./ModeCard.module.css";
import duckHeadsetImg from "@/assets/images/duck_headset.png";
import duckTogetherImg from "@/assets/images/duck_together2.png";
import duckSoloImg from "@/assets/images/duck_solo.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import tapSound from "@/assets/sounds/tap.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ModeCard({
  title,
  description,
  onClick,
  variant = "practice",
  disabled = false,
  disabledMessage = "오픈 예정입니다",
}) {
  const [hovered, setHovered] = useState(false);
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playTapSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio(tapSound);
      audio.volume = getEffectiveVolume(0.1);
      audio.play().catch(() => {});
    } catch (e) {
      // 사운드 재생 실패 무시
    }
  };

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

  const cardClassName = `${styles.Card} ${disabled ? styles.Disabled : ""} ${variant === "together" ? styles.CardTogether : ""}`;

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <div
      className={styles.CardWrap}
      onMouseEnter={() => {
        setHovered(true);
        // 연습 모드는 tap 사운드 재생 안 함
        if (variant !== "practice") {
          playTapSound();
        }
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className={cardClassName}
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
