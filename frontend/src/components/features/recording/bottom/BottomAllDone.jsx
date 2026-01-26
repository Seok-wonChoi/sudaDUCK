export default function BottomAllDone({ onRestart }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 items-center text-center p-4 md:p-5 lg:p-6" aria-live="polite">
      <p className="m-0 font-black text-sm md:text-base text-green-500 tracking-wide">
        🎉 전체 문장 녹음 완료!
      </p>
      <p className="m-0 text-xs md:text-sm text-gray-500 font-medium">
        수고했어요. 다시 연습하거나 결과 페이지로 이동할 수 있어요.
      </p>

      <div className="flex gap-2 md:gap-3 mt-1">
        <button
          className="border-2 border-gray-200 bg-white text-gray-900
            font-extrabold py-2.5 px-4 md:py-3 md:px-6 rounded-xl cursor-pointer text-xs md:text-sm
            transition-all hover:border-[#2b7fff] hover:text-[#2b7fff] hover:bg-blue-50
            hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none"
          onClick={onRestart}
        >
          다시하기
        </button>
      </div>
    </div>
  );
}
