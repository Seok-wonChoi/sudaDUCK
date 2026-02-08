import styles from "./ModalWrapper.module.css";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ModalWrapper({
  title,
  onClose,
  children,
  footer,
  showFooter = true,
}) {
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      playSound();
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
            onClick={() => {
              playSound();
              onClose?.();
            }}
            aria-label="닫기"
            data-click-sound="false"
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
