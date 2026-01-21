import styles from "./ModalWrapper.module.css";

export default function ModalWrapper({
  title,
  onClose,
  children,
  footer,
  showFooter = true,
}) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className={styles.Overlay} onClick={handleOverlayClick}>
      <div className={styles.Modal}>
        <div className={styles.Header}>
          <h2 className={styles.Title}>{title}</h2>
          <button
            type="button"
            className={styles.CloseButton}
            onClick={onClose}
            aria-label="닫기"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className={styles.Divider} />

        <div className={styles.Content}>{children}</div>

        {showFooter && (
          <>
            <div className={styles.FooterDivider} />
            <div className={styles.Footer}>{footer}</div>
          </>
        )}
      </div>
    </div>
  );
}
