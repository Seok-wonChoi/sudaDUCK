import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ConfirmModal({
  open,
  title,
  message = "정말 나가시겠습니까?",
  confirmText = "나가기",
  cancelText = "취소",
  onConfirm,
  onClose,
  onCancel,
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
        // 사운드 재생 실패 무시
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

  return createPortal(
    <div className={styles.Overlay} role="presentation" onClick={handleClose}>
      <div
        className={styles.Dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title || "확인"}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className={styles.Title}>{title}</div>}
        <div className={`${styles.Message} ${title ? styles.HasTitle : ""}`}>
          {message}
        </div>

        <div className={styles.Actions}>
          {cancelText && (
            <button
              type="button"
              className={styles.CancelButton}
              onClick={handleClose}
              ref={cancelRef}
              data-click-sound="false"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={styles.ConfirmButton}
            onClick={onConfirm || handleClose}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
