export default function BottomIdle({ onStart, onNext }) {
  const handleStart = onStart || onNext;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 sm:py-9 md:py-12 px-3 sm:px-4 md:px-5">
      <div className="text-center">
        <p className="font-medium text-sm md:text-base leading-relaxed text-gray-400 m-0">
          녹음 대기 중...
        </p>
        <p className="text-sm text-gray-500 mt-1">시작을 누르면 AI가 문장을 읽어줘요.</p>
      </div>

      <div className="flex gap-3 mt-1">
        <button
          className="border-none bg-gradient-to-br from-[#2B7FFF] to-[#1d6fef] text-white
            font-extrabold py-3 px-6 rounded-xl cursor-pointer text-sm
            shadow-[0_4px_6px_-1px_rgba(43,127,255,0.3)] transition-all
            hover:from-[#1d6fef] hover:to-[#1560d9] hover:-translate-y-0.5
            hover:shadow-[0_8px_12px_-2px_rgba(43,127,255,0.4)]
            active:translate-y-0 active:shadow-[0_2px_4px_-1px_rgba(43,127,255,0.3)]"
          onClick={handleStart}
        >
          시작
        </button>
      </div>
    </div>
  );
}
