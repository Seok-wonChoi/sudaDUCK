import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";

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

  const handleClose = onClose || onCancel;

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
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
          <button
            type="button"
            className={styles.CancelButton}
            onClick={handleClose}
            ref={cancelRef}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={styles.ConfirmButton}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
