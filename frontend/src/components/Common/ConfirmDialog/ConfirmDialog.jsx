import { createPortal } from "react-dom";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  title = "나가기",
  message = "정말 나가시겠습니까?",
  confirmText = "나가기",
  cancelText = "취소",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div className={styles.Overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.Card}>
        <div className={styles.Title}>{title}</div>
        <div className={styles.Message}>{message}</div>

        <div className={styles.Actions}>
          <button type="button" className={styles.CancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={styles.ConfirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
