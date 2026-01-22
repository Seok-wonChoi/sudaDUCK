import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import ExitConfirmModal from "../ExitConfirmModal/ExitConfirmModal";
import styles from "./ExitGuard.module.css";

export default function ExitGuard({
  to = "/",
  message = "메인 화면으로 나가시겠습니까?",
  hitWidth = 190,
  hitHeight = 72,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const handleExit = useCallback(() => {
    setOpen(false);
    navigate(to);
  }, [navigate, to]);

  return (
    <>
      <button
        type="button"
        className={styles.LogoHitArea}
        style={{ width: hitWidth, height: hitHeight }}
        onClick={openModal}
        aria-label="메인 화면으로 나가기"
      />

      <ExitConfirmModal
        open={open}
        message={message}
        confirmText="나가기"
        cancelText="취소"
        onConfirm={handleExit}
        onClose={closeModal}
      />
    </>
  );
}
