import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

export default function ExitButton({
  to = "/",
  label = "나가기",
  message = "메인 화면으로 나가시겠습니까?",
  confirmText = "나가기",
  cancelText = "취소",
  className = "",
  onExit,
  replace = true,
  disabled = false,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);

    if (typeof onExit === "function") onExit();

    navigate(to, { replace });
  }, [navigate, onExit, replace, to]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`inline-flex items-center justify-center h-9 px-3.5 rounded-lg
          border border-red-500/35 bg-red-500/10 text-red-500
          text-xs font-black cursor-pointer select-none
          hover:bg-red-500/15 active:translate-y-px transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
      >
        {label}
      </button>

      <ConfirmModal
        open={open}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  );
}
