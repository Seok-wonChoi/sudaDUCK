import { useEffect, useMemo, useRef, useState } from "react";

export default function UnexpectedQuestMatchModeModal({ open, duckSrc, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const firstBtnRef = useRef(null);

  const question = useMemo(
    () => "I couldn't agree with you more on that point.",
    []
  );

  const options = useMemo(
    () => [
      { id: "a", text: "그 부분에 완전 공감해요." },
      { id: "b", text: "그 부분은 잘 모르겠어요." },
      { id: "c", text: "그 부분은 동의하기 어려워요." },
      { id: "d", text: "그 얘기는 넘어가죠." },
    ],
    []
  );

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      firstBtnRef.current?.focus?.();
    }, 60);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleChoose = (optId) => {
    setSelected(optId);
    onSubmit?.({ choice: optId });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && selected) {
      e.preventDefault();
      onSubmit?.({ choice: selected });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-indigo-900/90 flex items-center justify-center z-[9999]"
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      <div className="relative flex flex-col items-center">
        <div className="bg-white rounded-2xl p-5 w-[320px] sm:w-[420px] shadow-2xl">
          <div className="text-center mb-4">
            <div className="text-lg font-black text-indigo-600 mb-1">돌발 퀘스트 - 매칭 모드</div>
            <div className="text-xs text-gray-400">퍼블리싱 단계: 아무 항목이나 선택해도 진행됩니다.</div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="text-xs font-semibold text-blue-600 mb-1">영어 문장</div>
            <div className="text-base font-medium text-gray-900">{question}</div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="py-1 px-2 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">매칭</div>
            <div className="text-xs text-gray-600">위 문장과 의미/뉘앙스가 가장 가까운 표현을 골라주세요.</div>
          </div>

          <div className="flex flex-col gap-2" role="list">
            {options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                ref={idx === 0 ? firstBtnRef : null}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all
                  ${selected === opt.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200"
                  }`}
                onClick={() => handleChoose(opt.id)}
                onFocus={() => setSelected(opt.id)}
                role="listitem"
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${selected === opt.id ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}
                >
                  {selected === opt.id && <span className="w-2 h-2 bg-white rounded-full" />}
                </span>
                <span className="text-sm text-gray-900">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {duckSrc && <img className="w-24 h-24 object-contain mt-4" src={duckSrc} alt="돌발 퀘스트 오리" />}
      </div>
    </div>
  );
}
