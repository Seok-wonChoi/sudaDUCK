import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ConfirmModal({
  open,
  title,
  message = "?•ë§ ?˜ê??œê² ?µë‹ˆê¹?",
  confirmText = "?˜ê?ê¸?,
  cancelText = "ì·¨ì†Œ",
  onConfirm,
  onClose,
  onCancel,
  reverseButtons = false, // ?‘ˆ ë²„íŠ¼ ?œì„œ ë°˜ì „ ?µì…˜ ì¶”ê?
  small = false, // ?‘ˆ ë²„íŠ¼ ?¬ê¸° ì¶•ì†Œ ?µì…˜ ì¶”ê?
}) {
  const cancelRef = useRef(null);
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playSound = () => {
    if (!isMuted) {
      try {
        const audio = new Audio(lightButtonSound);
        audio.volume = getEffectiveVolume(0.1);
        audio.play().catch(() => {});
      } catch (e) {
        // ?¬ìš´???¬ìƒ ?¤íŒ¨ ë¬´ì‹œ
      }
    }
  };

  const handleClose = () => {
    playSound();
    (onClose || onCancel)?.();
  };

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
      if (e.key === "Escape") handleClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  // ë²„íŠ¼ ë°°ì—´ ?ì„± (cancelTextê°€ ?ˆì„ ?Œë§Œ ì·¨ì†Œ ë²„íŠ¼ ?¬í•¨)
  const buttons = [];

  if (cancelText) {
    buttons.push(
      <button
        key="cancel"
        type="button"
        className={`${styles.CancelButton} ${small ? styles.Small : ""}`}
        onClick={handleClose}
        ref={cancelRef}
        data-click-sound="false"
      >
        {cancelText}
      </button>
    );
  }

  buttons.push(
    <button
      key="confirm"
      type="button"
      className={styles.ConfirmButton}
      onClick={onConfirm || handleClose}
    >
      {confirmText}
    </button>
  );

  return createPortal(
    <div className={styles.Overlay} role="presentation" onClick={handleClose}>
      <div
        className={styles.Dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title || "?•ì¸"}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className={styles.Title}>{title}</div>}
        <div className={`${styles.Message} ${title ? styles.HasTitle : ""}`}>
          {message}
        </div>

        <div className={styles.Actions}>
          {reverseButtons ? [...buttons].reverse() : buttons}
        </div>
      </div>
    </div>,
    document.body
  );
}
