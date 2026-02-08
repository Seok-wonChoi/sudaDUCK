import { useState } from "react";
import styles from "./ModeCard.module.css";
import duckHeadsetImg from "@/assets/images/duck_headset.png";
import duckTogetherImg from "@/assets/images/duck_together2.png";
import duckSoloImg from "@/assets/images/duck_solo.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import duckExcellentImg from "@/assets/images/duck_excellent.png"; // ?‘ˆ ì¶”ê?
import tapSound from "@/assets/sounds/tap.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ModeCard({
  title,
  description,
  onClick,
  variant = "practice",
  disabled = false,
  disabledMessage = "?¤í”ˆ ?ˆì •?…ë‹ˆ??,
  className = "",
  isActive = true, // ?‘ˆ ì¶”ê?: ?œì„±?”ëœ ì¹´ë“œ(ì¤‘ì•™)?¸ì? ?¬ë?
}) {
  const [hovered, setHovered] = useState(false);
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playTapSound = () => {
    if (isMuted || !isActive) return; // ?‘ˆ ë¹„í™œ?±í™”??ì¹´ë“œ???Œë¦¬ ?¬ìƒ ????
    try {
      const audio = new Audio(tapSound);
      audio.volume = getEffectiveVolume(0.1);
      audio.play().catch(() => {});
    } catch (e) {
      // ?¬ìš´???¬ìƒ ?¤íŒ¨ ë¬´ì‹œ
    }
  };

  // ?´ë?ì§€ ? íƒ
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
    case "mypage":
      duckSrc = duckExcellentImg; // ?‘ˆ êµì²´
      break;
    default:
      duckSrc = duckHeadsetImg;
  }

  // ?´ë?ì§€ ë°??¹ìˆ˜ ?¨ê³¼ ?ìš© ?¬ë? ?ë‹¨ (ì¤‘ì•™???ˆì„ ?Œë§Œ ?ìš©)
  const isSpecialVariant = (variant === "together" || variant === "mypage") && isActive;

  const duckClassName = isSpecialVariant
      ? `${styles.Duck} ${styles.DuckTogether}`
      : styles.Duck;

  const cardClassName = `${styles.Card} ${disabled ? styles.Disabled : ""} ${isSpecialVariant ? styles.CardTogether : ""} ${!isActive ? styles.NotActive : ""} ${className}`;

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <div
      className={styles.CardWrap}
      onMouseEnter={() => {
        setHovered(true);
        // ?°ìŠµ ëª¨ë“œ??tap ?¬ìš´???¬ìƒ ????
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

          {/* ?Œìƒ‰ ?¤ë²„?ˆì´ + ë°°ì? */}
          {disabled && (
            <>
              <div className={styles.Overlay} aria-hidden="true" />
              <div className={styles.Badge}>?¤í”ˆ ?ˆì •</div>
            </>
          )}
        </div>

        <div className={styles.Title}>{title}</div>
        <div className={styles.Description}>{description}</div>
      </button>

      {/* hover ?´íŒ */}
      {disabled && hovered && (
        <div className={styles.Tooltip} role="status" aria-live="polite">
          {disabledMessage}
        </div>
      )}
    </div>
  );
}
