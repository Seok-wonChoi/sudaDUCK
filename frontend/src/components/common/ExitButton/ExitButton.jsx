import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ExitButton.module.css";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import { useSoundContext } from "@/context/SoundContext";

import ConfirmModal from "../ConfirmModal/ConfirmModal";

export default function ExitButton({
  to = "/",
  label = "?˜ê?ê¸?,

  // ê¸°ì¡´ props
  message = "ë©”ì¸ ?”ë©´?¼ë¡œ ?˜ê??œê² ?µë‹ˆê¹?",

  // ?¸í™˜: ê¸°ì¡´??confirmMessageë¡??˜ê¸°??ê²½ìš°??ë°›ë„ë¡?ì²˜ë¦¬
  confirmMessage,

  confirmText = "?˜ê?ê¸?,
  cancelText = "ì·¨ì†Œ",
  className = "",
  onExit,
  replace = true,
  disabled = false,
}) {
  const navigate = useNavigate();
  const { getEffectiveVolume, isMuted } = useSoundContext();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const handleOpen = useCallback(() => {
    if (disabled || processing) return;
    playSound();
    setOpen(true);
  }, [disabled, processing]);

  const handleClose = useCallback(() => {
    if (processing) return;
    setOpen(false);
  }, [processing]);

  const handleConfirm = useCallback(async () => {
    if (processing) return;

    setProcessing(true);
    try {
      // ?˜ì˜ˆ??ë²„íŠ¼???Œë????Œë§Œ ?¤í–‰
      if (typeof onExit === "function") {
        await onExit();
      }

      setOpen(false);
      navigate(to, { replace });
    } catch (e) {
      alert(e?.message || "?˜ê?ê¸°ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      // ?¤íŒ¨ ??ëª¨ë‹¬?€ ?´ì–´??ì±„ë¡œ ? ì?(?¬ì‹œ??ì·¨ì†Œ ê°€??
    } finally {
      setProcessing(false);
    }
  }, [navigate, onExit, replace, to, processing]);

  return (
    <>
      <button
        type="button"
        className={`${styles.Button} ${className}`}
        onClick={handleOpen}
        disabled={disabled || processing}
        aria-label={label}
      >
        <span className={styles.Arrow} aria-hidden="true">
          &lt;
        </span>
      </button>

      <ConfirmModal
        open={open}
        message={confirmMessage ?? message}
        confirmText={processing ? "?˜ê???ì¤?.." : confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  );
}
