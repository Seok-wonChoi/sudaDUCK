import { useEffect, useRef } from "react";
import styles from "./ExitConfirmModal.module.css";

export default function ExitConfirmModal({
  open,
  message = "메인 화면으로 나가시겠습니까?",
  confirmText = "나가기",
  cancelText = "취소",
  onConfirm,
  onClose,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.Overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.Dialog}
        role="dialog"
        aria-modal="true"
        aria-label="나가기 확인"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.Message}>{message}</div>

        <div className={styles.Actions}>
          <button
            type="button"
            className={styles.CancelButton}
            onClick={onClose}
            ref={cancelRef}
          >
            {cancelText}
          </button>

          <button type="button" className={styles.ConfirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
