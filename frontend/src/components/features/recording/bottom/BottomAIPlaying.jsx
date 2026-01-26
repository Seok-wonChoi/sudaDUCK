export default function BottomAIPlaying({ onSkip }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 items-center text-center p-4 md:p-5 lg:p-6" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <div
          className="w-3 h-3 rounded-full bg-green-500 animate-pulse
            shadow-[0_0_8px_rgba(34,197,94,0.4)]"
        />
        <p className="m-0 font-extrabold text-sm md:text-base text-gray-900 tracking-wide">
          AI 음성 재생 중...
        </p>
      </div>

      <p className="m-0 text-xs md:text-sm text-gray-500 font-medium">
        다 들은 후 자동으로 녹음 단계로 넘어가요.
      </p>

      <div className="flex gap-2 md:gap-3 mt-1">
        <button
          className="border-2 border-gray-200 bg-white text-gray-900
            font-bold py-2 px-3.5 md:py-3 md:px-5 rounded-xl cursor-pointer text-xs md:text-sm
            transition-all hover:border-[#2b7fff] hover:text-[#2b7fff] hover:bg-blue-50
            hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none"
          onClick={onSkip}
        >
          스킵
        </button>
      </div>
    </div>
  );
}
