import { useCallback, useEffect, useState } from "react";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { subscribeExitConfirm } from "./exitConfirmStore";

export default function ExitGuard({
  title = "나가기",
  message = "정말 나가시겠습니까?",
  confirmText = "나가기",
  cancelText = "취소",
}) {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeExitConfirm((payload) => {
      setDialog(payload);
    });
    return unsubscribe;
  }, []);

  const handleCancel = useCallback(() => {
    if (dialog && typeof dialog.onCancel === "function") dialog.onCancel();
    setDialog(null);
  }, [dialog]);

  const handleConfirm = useCallback(() => {
    const onConfirm = dialog?.onConfirm;
    setDialog(null);
    if (typeof onConfirm === "function") onConfirm();
  }, [dialog]);

  const open = Boolean(dialog);

  return (
    <ConfirmModal
      open={open}
      title={dialog?.title ?? title}
      message={dialog?.message ?? message}
      confirmText={dialog?.confirmText ?? confirmText}
      cancelText={dialog?.cancelText ?? cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
