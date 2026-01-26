import { useEffect, useRef, useState } from "react";

export default function UnexpectedQuestFillBlankModal({ open, duckSrc, onSubmit }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      firstRef.current?.focus?.();
    }, 50);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onSubmit?.({ a, b });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-indigo-900/90 flex items-center justify-center z-[9999]"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col items-center">
        <div className="bg-white rounded-2xl p-6 w-[320px] sm:w-[400px] shadow-2xl">
          <div className="text-xl font-black text-indigo-600 text-center mb-1">돌발 퀘스트!!</div>
          <div className="text-sm text-gray-500 text-center mb-5">빈칸을 채워보세요.</div>

          <div className="flex items-center gap-2 flex-wrap justify-center mb-5">
            <span className="text-base font-semibold text-gray-900">The</span>
            <input
              ref={firstRef}
              className="w-20 h-10 px-3 border-2 border-indigo-200 rounded-lg text-center
                focus:outline-none focus:border-indigo-500"
              value={a}
              onChange={(e) => setA(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <span className="text-base font-semibold text-gray-900">was</span>
            <input
              className="w-20 h-10 px-3 border-2 border-indigo-200 rounded-lg text-center
                focus:outline-none focus:border-indigo-500"
              value={b}
              onChange={(e) => setB(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <span className="text-base font-semibold text-gray-900">too.</span>
          </div>

          <button
            type="button"
            className="w-full h-12 border-none rounded-xl bg-indigo-600
              text-white text-base font-bold cursor-pointer hover:bg-indigo-700"
            onClick={submit}
          >
            입력
          </button>

          <div className="mt-3 text-xs text-gray-400 text-center">
            퍼블리싱 단계: 아무 단어나 입력하면 진행됩니다.
          </div>
        </div>

        {duckSrc && <img className="w-24 h-24 object-contain mt-4" src={duckSrc} alt="돌발 퀘스트 오리" />}
      </div>
    </div>
  );
}
