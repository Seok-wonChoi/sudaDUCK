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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[480px] max-h-[90vh]
          overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between py-5 px-6">
          <h2 className="text-xl font-black text-gray-900 m-0">{title}</h2>
          <button
            type="button"
            className="w-8 h-8 border-none bg-transparent cursor-pointer
              flex items-center justify-center text-2xl text-gray-500 rounded-lg
              hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={onClose}
            aria-label="닫기"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {showFooter && (
          <>
            <div className="h-px bg-gray-200" />
            <div className="py-4 px-6 flex justify-end gap-3 bg-gray-50">{footer}</div>
          </>
        )}
      </div>
    </div>
  );
}
