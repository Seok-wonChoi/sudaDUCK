import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ExitButton.module.css";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import { useSoundContext } from "@/context/SoundContext";

import ConfirmModal from "../ConfirmModal/ConfirmModal";

export default function ExitButton({
  to = "/",
  label = "나가기",

  // 기존 props
  message = "메인 화면으로 나가시겠습니까?",

  // 호환: 기존에 confirmMessage로 넘기는 경우도 받도록 처리
  confirmMessage,

  confirmText = "나가기",
  cancelText = "취소",
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
        // 사운드 재생 실패 무시
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
      // ‘예’ 버튼을 눌렀을 때만 실행
      if (typeof onExit === "function") {
        await onExit();
      }

      setOpen(false);
      navigate(to, { replace });
    } catch (e) {
      alert(e?.message || "나가기에 실패했습니다.");
      // 실패 시 모달은 열어둔 채로 유지(재시도/취소 가능)
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
        confirmText={processing ? "나가는 중..." : confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  );
}
