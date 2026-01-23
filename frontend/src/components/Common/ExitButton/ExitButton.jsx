import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ExitButton.module.css";

import ExitConfirmModal from "../ExitConfirmModal/ExitConfirmModal";


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
        className={`${styles.Button} ${className}`}
        onClick={handleOpen}
        disabled={disabled}
      >
        {label}
      </button>

      <ExitConfirmModal
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
