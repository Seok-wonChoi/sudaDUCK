import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
    <div
      className="fixed inset-0 bg-gray-900/45 flex items-center justify-center z-[9999]"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="w-[min(420px,calc(100vw-32px))] bg-white rounded-2xl border border-gray-200/90 shadow-2xl p-4 sm:p-[18px]"
        role="dialog"
        aria-modal="true"
        aria-label={title || "확인"}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="text-sm font-black text-gray-900 text-center">{title}</div>
        )}
        <div
          className={`text-sm font-black text-gray-900 leading-relaxed
            ${title ? "mt-2.5 text-xs font-bold text-gray-500 text-center whitespace-pre-line" : ""}`}
        >
          {message}
        </div>

        <div className="mt-3.5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            ref={cancelRef}
            className="h-9 px-3.5 rounded-lg bg-white border border-gray-200 text-sm font-black text-gray-900 cursor-pointer
              focus-visible:outline-2 focus-visible:outline-indigo-500/60 focus-visible:outline-offset-2
              hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-3.5 rounded-lg bg-indigo-600 border border-indigo-600 text-sm font-black text-white cursor-pointer
              focus-visible:outline-2 focus-visible:outline-indigo-500/60 focus-visible:outline-offset-2
              hover:bg-indigo-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
