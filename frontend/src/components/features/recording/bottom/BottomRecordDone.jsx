export default function BottomRecordDone({ onNext, isLast = false }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 items-center text-center p-4 md:p-5 lg:p-6" aria-live="polite">
      <p className="m-0 font-black text-sm md:text-base text-gray-900 tracking-wide">
        ✅ 문장 녹음 완료!
      </p>
      <p className="m-0 text-xs md:text-sm text-gray-500 font-medium">
        {isLast ? '마지막 문장까지 완료했어요.' : '다음 문장으로 넘어갈까요?'}
      </p>

      <div className="flex gap-2 md:gap-3 mt-1">
        <button
          className="border-none bg-gradient-to-br from-[#2b7fff] to-blue-700 text-white
            font-extrabold py-2.5 px-4 md:py-3 md:px-6 rounded-xl cursor-pointer text-xs md:text-sm
            shadow-[0_4px_6px_-1px_rgba(43,127,255,0.3)] transition-all
            hover:from-blue-700 hover:to-blue-800 hover:-translate-y-0.5
            hover:shadow-[0_8px_12px_-2px_rgba(43,127,255,0.4)]
            active:translate-y-0 active:shadow-[0_2px_4px_-1px_rgba(43,127,255,0.3)]"
          onClick={onNext}
        >
          {isLast ? '완료 화면으로' : '다음 문장'}
        </button>
      </div>
    </div>
  );
}
