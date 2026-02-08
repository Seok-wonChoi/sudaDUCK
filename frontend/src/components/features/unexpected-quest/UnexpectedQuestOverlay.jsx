import { useEffect } from "react";
import styles from "./UnexpectedQuestOverlay.module.css";
import speechBubbleImg from "@/assets/images/speech_bubble.png";
import speechBubble2Img from "@/assets/images/speech_bubble2.png";
import speechBubble3Img from "@/assets/images/speech_bubble3.png";

export default function UnexpectedQuestOverlay({
  open,
  onClose,

  duckSrc,
  bubbleText,
  bubbleTitle,  // Í∞ïÏ°∞???úÎ™© (?†ÌÉù?¨Ìï≠)
  subText,
  subTone = "normal",
  countdownNumber,
  speechBubbleType = 1, // 1, 2, 3 Ï§??†ÌÉù
  textSize = "normal", // "normal", "large", "small"

  // Ï∂îÍ?: Î≤ÑÌäº ?ÜÎäî ?îÎ©¥???¥Î¶≠?ºÎ°ú ?òÍ∏∞Í∏?
  clickAnywhere = false,     // trueÎ©??îÎ©¥ ?ÑÎ¨¥ Í≥≥Ïù¥???¥Î¶≠ ??onClose ?∏Ï∂ú
  showCloseButton = false,   // X Î≤ÑÌäº ?ÑÏöî???åÎßå true
  escToClose = false,        // ?ÑÏöî???åÎßå true
}) {
  useEffect(() => {
    if (!open) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape" && escToClose) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, escToClose, onClose]);

  if (!open) return null;

  const handleClick = () => {
    if (clickAnywhere) onClose?.();
  };

  const stop = (e) => {
    // clickAnywhereÍ∞Ä false???îÎ©¥?êÏÑú???¥Î? ?¥Î¶≠?ºÎ°ú ?´ÌûàÏßÄ ?äÍ≤å
    if (!clickAnywhere) e.stopPropagation();
  };

  // speech bubble ?¥Î?ÏßÄ ?†ÌÉù
  const bubbleImgSrc =
    speechBubbleType === 2
      ? speechBubble2Img
      : speechBubbleType === 3
        ? speechBubble3Img
        : speechBubbleImg;

  return (
    <div
      className={styles.Backdrop}
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.Stage} onClick={clickAnywhere ? handleClick : stop}>
        {showCloseButton ? (
          <button
            type="button"
            className={styles.CloseBtn}
            onClick={onClose}
            aria-label="?´Í∏∞"
          >
            √ó
          </button>
        ) : null}

        <div className={styles.BubbleWrap}>
          <img className={styles.BubbleImg} src={bubbleImgSrc} alt="" />
          <div className={styles.BubbleContent}>
            {bubbleTitle ? (
              <div className={styles.BubbleTitle}>{bubbleTitle}</div>
            ) : null}
            <div className={`${styles.BubbleText} ${
              textSize === "large" ? styles.BubbleTextLarge :
              textSize === "small" ? styles.BubbleTextSmall : ""
            }`}>{bubbleText}</div>

            {subText ? (
              <div
                className={`${styles.SubText} ${
                  subTone === "danger" ? styles.SubTextDanger : ""
                }`}
              >
                {subText}
              </div>
            ) : null}
          </div>
        </div>

        {typeof countdownNumber === "number" ? (
          <div className={styles.CountdownCircle} aria-label={`Ïπ¥Ïö¥?∏Îã§??${countdownNumber}`}>
            {countdownNumber}
          </div>
        ) : null}

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="?åÎ∞ú ?òÏä§???§Î¶¨" /> : null}
      </div>
    </div>
  );
}
