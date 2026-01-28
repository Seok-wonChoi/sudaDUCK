import { useEffect } from "react";
import styles from "./UnexpectedQuestOverlay.module.css";
import speechBubbleImg from "@/assets/images/speech_bubble.png";

export default function UnexpectedQuestOverlay({
  open,
  onClose,

  duckSrc,
  bubbleText,
  subText,
  subTone = "normal",
  countdownNumber,

  // 추가: 버튼 없는 화면을 클릭으로 넘기기
  clickAnywhere = false,     // true면 화면 아무 곳이나 클릭 시 onClose 호출
  showCloseButton = false,   // X 버튼 필요할 때만 true
  escToClose = false,        // 필요할 때만 true
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
    // clickAnywhere가 false인 화면에서는 내부 클릭으로 닫히지 않게
    if (!clickAnywhere) e.stopPropagation();
  };

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
            aria-label="닫기"
          >
            ×
          </button>
        ) : null}

        <div className={styles.BubbleWrap}>
          <img className={styles.BubbleImg} src={speechBubbleImg} alt="" />
          <div className={styles.BubbleContent}>
            <div className={styles.BubbleText}>{bubbleText}</div>

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
          <div className={styles.CountdownCircle} aria-label={`카운트다운 ${countdownNumber}`}>
            {countdownNumber}
          </div>
        ) : null}

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="돌발 퀘스트 오리" /> : null}
      </div>
    </div>
  );
}
