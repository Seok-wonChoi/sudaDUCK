import { useEffect } from "react";
import speechBubbleImg from "@/assets/images/speech_bubble.png";

export default function UnexpectedQuestOverlay({
  open,
  onClose,
  duckSrc,
  bubbleText,
  subText,
  subTone = "normal",
  countdownNumber,
  clickAnywhere = false,
  showCloseButton = false,
  escToClose = false,
}) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape" && escToClose) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, escToClose, onClose]);

  if (!open) return null;

  const handleClick = () => {
    if (clickAnywhere) onClose?.();
  };

  const stop = (e) => {
    if (!clickAnywhere) e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-indigo-900/90 flex items-center justify-center z-[9999]"
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col items-center"
        onClick={clickAnywhere ? handleClick : stop}
      >
        {showCloseButton && (
          <button
            type="button"
            className="absolute top-2 right-2 w-10 h-10 border-none bg-white/20 text-white
              text-2xl rounded-full cursor-pointer hover:bg-white/30"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        )}

        <div className="relative mb-4">
          <img className="w-[280px] sm:w-[320px] h-auto" src={speechBubbleImg} alt="" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-lg sm:text-xl font-black text-gray-900 mb-1">{bubbleText}</div>
            {subText && (
              <div className={`text-sm font-semibold ${subTone === "danger" ? "text-red-500" : "text-gray-500"}`}>
                {subText}
              </div>
            )}
          </div>
        </div>

        {typeof countdownNumber === "number" && (
          <div
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-xl"
            aria-label={`카운트다운 ${countdownNumber}`}
          >
            <span className="text-4xl font-black text-indigo-600">{countdownNumber}</span>
          </div>
        )}

        {duckSrc && <img className="w-28 h-28 object-contain" src={duckSrc} alt="돌발 퀘스트 오리" />}
      </div>
    </div>
  );
}
